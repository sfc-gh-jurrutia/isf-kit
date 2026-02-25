# GPU Notebook & Distributed Training Guide

## Instance Families

| Family | GPUs | Memory | Use Case |
|--------|------|--------|----------|
| `GPU_NV_S` | 1 | 24GB | Single-GPU, inference |
| `GPU_NV_M` | 4 | 96GB total | Multi-GPU distributed training |

## Distributed Training Architecture

```
┌─────────────────────────────────────────────┐
│           PyTorchDistributor                │
├─────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ Worker 0│  │ Worker 1│  │ Worker N│     │
│  │ GPU 0   │  │ GPU 1   │  │ GPU N   │     │
│  │ Shard 0 │  │ Shard 1 │  │ Shard N │     │
│  └─────────┘  └─────────┘  └─────────┘     │
├─────────────────────────────────────────────┤
│         ShardedDataConnector                │
└─────────────────────────────────────────────┘
```

## Distributed Training Setup

```python
from snowflake.ml.modeling.distributors.pytorch import (
    PyTorchDistributor, PyTorchScalingConfig, WorkerResourceConfig
)
from snowflake.ml.data.sharded_data_connector import ShardedDataConnector

df = session.table("training_data")
train_data = ShardedDataConnector.from_dataframe(df)

pytorch_trainer = PyTorchDistributor(
    train_func=train_func,
    scaling_config=PyTorchScalingConfig(
        num_nodes=1,
        num_workers_per_node=4,
        resource_requirements_per_worker=WorkerResourceConfig(
            num_cpus=0, num_gpus=1
        )
    )
)

pytorch_trainer.run(
    dataset_map={"train": train_data},
    hyper_params={"batch_size": "32", "num_epochs": "5"}
)
```

## Training Function Template

```python
def train_func():
    # IMPORTS MUST BE INSIDE FUNCTION
    import os
    import torch
    import torch.distributed as dist
    from torch.nn.parallel import DistributedDataParallel as DDP
    from torch.utils.data import DataLoader, IterableDataset
    from snowflake.ml.modeling.distributors.pytorch import get_context
    
    # Set BEFORE CUDA operations
    os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
    os.environ["RAY_DISABLE_SIGTERM_HANDLER"] = "1"
    
    # Initialize distributed context
    context = get_context()
    rank = context.get_rank()
    world_size = context.get_world_size()
    dist.init_process_group(backend="nccl")
    
    with torch.cuda.device(rank):
        # Get data shard
        dataset_map = context.get_dataset_map()
        train_shard = dataset_map["train"].get_shard().to_torch_dataset()
        
        # Setup DataLoader
        train_loader = DataLoader(
            train_shard,
            batch_size=32,
            shuffle=False,  # ShardedDataConnector handles shuffling
            pin_memory=True,
            pin_memory_device=f"cuda:{rank}"
        )
        
        # Setup model with DDP
        model = create_model()
        model.to(rank)
        model = DDP(model, device_ids=[rank])
        
        # Training loop
        for epoch in range(num_epochs):
            for batch in train_loader:
                # ... training code ...
                pass
        
        # Save model (RANK 0 ONLY)
        if rank == 0:
            torch.save(model.module.state_dict(), "/tmp/model.pt")
```

## Critical Patterns

| Pattern | Requirement | Reason |
|---------|-------------|--------|
| Imports inside function | Required | Function serialized to workers |
| `dist.init_process_group("nccl")` | Required | Initialize GPU communication |
| `DDP(model, device_ids=[rank])` | Required | Gradient synchronization |
| `model.module.state_dict()` | Required | Access model inside DDP wrapper |
| Rank 0 save only | Required | Avoid file conflicts |

## Model Registry with GPU

```python
from snowflake.ml.registry import Registry

ml_reg = Registry(session=session)

model_version = ml_reg.log_model(
    inference_model,
    model_name="MyModel",
    version_name='v1',
    pip_requirements=["torch==2.6.0", "torchvision==0.21.0"],
    sample_input_data=sample_spdf,
    options={
        "embed_local_ml_library": True,
        "relax": True,
        "use_gpu": True,
        "cuda_version": "12.6"
    },
    target_platforms=["SNOWPARK_CONTAINER_SERVICES"]
)
```

## GPU Inference Service

```python
mv = ml_reg.get_model("MyModel").version("v1")

mv.create_service(
    service_name="MY_INFERENCE_SERVICE",
    service_compute_pool="MY_SERVICE_POOL",
    image_repo="DB.SCHEMA.IMAGE_REPO",
    max_instances=1,
    gpu_requests=1
)

# Run inference
result = mv.run(input_df, function_name="predict", service_name="MY_INFERENCE_SERVICE")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Compute pool full | `ALTER COMPUTE POOL name STOP ALL;` |
| CUDA OOM | Set `expandable_segments:True`, reduce batch |
| Model delete fails | Drop dependent services first |
| pip install fails | Set EXTERNAL_ACCESS_INTEGRATIONS |

