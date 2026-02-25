# Solution Package Directory Structure Template

```
solution_presentation/
├── [Solution]_Overview.md              # Step 1: Presentation Page
├── [Solution]_Architecture.md          # Step 2: Architecture documentation
├── [Solution]_About.py                 # Step 3: Streamlit About page
├── [Solution]_Blog.md                  # Step 4: Blog post
├── [Solution]_Slides.md                # Step 5: Slide content/script
├── [Solution]_Video_Script.md          # Step 6: Video script and specs
│
├── images/
│   ├── problem-impact.png              # Step 1
│   ├── before-after.png                # Step 1
│   ├── roi-value.png                   # Step 1
│   ├── data-erd.png                    # Step 1
│   ├── architecture.png                # Step 1
│   ├── architecture-detailed.png       # Step 2
│   ├── dashboard-preview.png           # Step 1
│   └── [domain-specific].png           # As needed
│
├── video/
│   ├── [Solution]_video_linkedin.mp4   # Step 6
│   ├── [Solution]_video_shorts.mp4     # Step 6 (vertical)
│   ├── [Solution]_captions.srt         # Step 6
│   └── thumbnail.png                   # Step 6
│
└── sources/
    └── [Solution]_Sources.md           # Step 4: External source documentation
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Solution name | PascalCase | `SupplyChainRisk` |
| File suffix | Step type | `_Overview`, `_Blog`, `_Slides` |
| Image names | lowercase-hyphenated | `problem-impact.png` |
| Video exports | platform suffix | `_video_linkedin.mp4` |

