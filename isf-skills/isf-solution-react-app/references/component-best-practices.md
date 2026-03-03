# UI Component Best Practices

Production-grade best practices for 60 UI components. Sourced from [component.gallery](https://component.gallery/) and [ui-design-brain](https://github.com/carmahhawwari/ui-design-brain), adapted for ISF solution context.

For ISF-specific implementations (code snippets using design system classes and template components), see `component-gallery.md`.

---

## Accordion

**Also known as:** Arrow toggle, Collapse, Collapsible sections, Details, Disclosure, Expandable

A vertically stacked set of collapsible sections -- each heading toggles between showing a short label and revealing the full content beneath it.

**Best practices:**
- Use for long-form content that benefits from progressive disclosure
- Keep headings concise and scannable -- they are the primary navigation
- Allow multiple sections open simultaneously unless space is critically limited
- Include a subtle expand/collapse icon (chevron) aligned consistently on the right
- Animate open/close with a short ease-out transition (150-250 ms)
- Ensure keyboard navigation: Enter/Space toggles, arrow keys move between headers

**Common layouts:**
- Risk factor drill-down with stacked category/detail pairs
- Settings panel with grouped preference sections
- Sidebar filter groups in dashboards
- Agent reasoning steps with expandable detail

---

## Alert

**Also known as:** Notification, Feedback, Message, Banner, Callout

A prominent message used to communicate important information or status changes.

**Best practices:**
- Use semantic color coding: red for errors, amber for warnings, green for success, blue for info
- Include a clear, actionable message -- not just a status label
- Provide a dismiss action for non-critical alerts
- Position inline alerts close to the relevant content, not floating arbitrarily
- Use an icon alongside color to ensure accessibility for color-blind users
- Keep alert text to one or two sentences maximum

**Common layouts:**
- Top-of-page banner for system-wide announcements
- Inline form validation message beneath an input field
- Toast notification stack in the bottom-right corner
- Contextual warning inside a card or settings section

---

## Avatar

A visual representation of a user, typically displayed as a photo, illustration, or initials.

**Best practices:**
- Support three sizes: small (24-32 px), medium (40-48 px), large (64-80 px)
- Fall back gracefully: image -> initials -> generic icon
- Use a subtle ring or border to separate the avatar from its background
- For groups, stack avatars with a slight overlap and a '+N' overflow indicator
- Ensure the image is loaded lazily with a placeholder shimmer

**Common layouts:**
- User profile header with name and role
- Comment thread with avatar beside each message
- Team member list with stacked avatar group
- Navigation bar user menu trigger

---

## Badge

**Also known as:** Tag, Label, Chip

A compact label within or near a larger component to convey status, category, or metadata.

**Best practices:**
- Keep badge text to one or two words -- they are labels, not sentences
- Use a limited palette of badge colors mapped to clear semantics
- Ensure sufficient contrast between badge text and background (WCAG AA minimum)
- Use pill shape (fully rounded corners) for status badges, rounded rectangles for tags
- Avoid overusing badges -- if everything is badged, nothing stands out

**Common layouts:**
- Status indicator on a table row (Active, Pending, Archived)
- Tag cloud beneath a product card or entity card
- Notification count on a nav icon
- Feature label on a KPI card

---

## Breadcrumbs

**Also known as:** Breadcrumb trail

A trail of links showing where the current page sits within the navigational hierarchy.

**Best practices:**
- Show the full hierarchy path; truncate middle segments on mobile with an ellipsis menu
- The current page should be the last item and should not be a link
- Use a subtle separator (/ or >) with adequate spacing
- Place breadcrumbs near the top of the content area, below the header
- Keep breadcrumb text lowercase or sentence-case for readability

**Common layouts:**
- Dashboard drill-down from overview to detail view
- Documentation site section navigation
- Entity hierarchy: category -> subcategory -> detail

---

## Button

An interactive control that triggers an action.

**Best practices:**
- Establish a clear visual hierarchy: primary (filled), secondary (outlined), tertiary (text-only)
- Use verb-first labels: 'Save changes', 'Create project', not 'Okay' or 'Submit'
- Minimum touch target of 44x44 px; desktop buttons at least 36 px tall
- Show a loading spinner inside the button during async actions -- disable to prevent double-clicks
- Limit to one primary button per visible viewport section
- Ensure focus ring is visible and high-contrast for keyboard users

**Common layouts:**
- Form footer with primary action right-aligned and secondary action left-aligned
- CTA button centered or left-aligned beneath headline
- Dialog footer with Cancel (secondary) and Confirm (primary)
- Action bar with grouped primary/secondary/ghost buttons

---

## Button group

**Also known as:** Toolbar

A container grouping related buttons as a single visual unit.

**Best practices:**
- Group only related actions -- unrelated buttons should be separated
- Visually connect buttons with shared border or tight spacing (1-2 px gap)
- Clearly indicate the active/selected state in toggle-style groups
- Keep the group to 2-5 buttons; more options warrant a dropdown or overflow menu

**Common layouts:**
- View switcher (grid view, list view, table view)
- Segmented date range selector (Day, Week, Month)
- Split button with primary action and a dropdown for alternatives

---

## Card

**Also known as:** Tile

A self-contained content block representing a single entity.

**Best practices:**
- Use a single, clear visual hierarchy: media -> title -> meta -> action
- Keep cards a consistent height in grid layouts -- use line clamping for variable text
- Make the entire card clickable when it represents a navigable entity
- Use subtle elevation (shadow) or a border -- not both simultaneously
- Limit card content to essential info; let the detail view carry the rest

**Common layouts:**
- Dashboard KPI cards with metric, delta, and sparkline
- Entity grid with thumbnail, name, status, and action
- Alert cards with severity, title, message, and recommendation
- Team member directory with avatar, name, and role

---

## Carousel

**Also known as:** Content slider

A component that cycles through multiple content slides.

**Best practices:**
- Provide visible navigation arrows and pagination dots
- Support swipe gestures on touch devices
- Auto-advance only if the user hasn't interacted; pause on hover/focus
- Show a peek of the next slide to signal scrollability
- Keep slide count manageable (3-7)
- Ensure accessibility: each slide reachable via keyboard

**Common layouts:**
- KPI card horizontal scroll on narrow viewports
- Image/screenshot galleries in documentation
- Alert card rotation for multi-entity overviews

---

## Checkbox

A selection control for multi-select from a list, or standalone for a single on/off choice.

**Best practices:**
- Use checkboxes for multi-select, not single toggles (use a switch for on/off)
- Align the checkbox to the first line of its label, not the center
- Support indeterminate state for 'select all' when children are partially selected
- Minimum 44 px touch target including label area
- Group related checkboxes under a fieldset with a legend for accessibility

**Common layouts:**
- Filter panel with multi-select facets
- Table row multi-select with header 'select all'
- Terms & conditions single checkbox with long label

---

## Combobox

**Also known as:** Autocomplete, Autosuggest

A select-like input enhanced with a free-text field that filters options as you type.

**Best practices:**
- Show suggestions after 1-2 characters to reduce noise
- Highlight matched text within each suggestion for scannability
- Allow keyboard navigation (arrow keys + Enter) through the dropdown
- Show a 'no results' message instead of an empty dropdown
- Debounce input to avoid excessive API calls (200-300 ms)

**Common layouts:**
- Entity selector with search in header
- Multi-select filters (region, category, status)
- Tag input that suggests existing tags

---

## Date input

A date entry control, often split into separate day, month, and year fields.

**Best practices:**
- Clearly label the expected format (DD/MM/YYYY or MM/DD/YYYY)
- Use separate fields for day, month, and year for unambiguous entry
- Validate in real-time and show errors inline
- Support auto-advancing between fields when a segment is complete

**Common layouts:**
- Date range filter in dashboard toolbar
- Invoice or report date field

---

## Datepicker

**Also known as:** Calendar, Datetime picker

A calendar-based control for selecting dates visually.

**Best practices:**
- Allow both manual text entry and calendar selection
- Clearly indicate the expected date format
- Highlight today's date and the currently selected date
- Disable dates outside the valid range
- Support keyboard navigation through the calendar grid
- For date ranges, show both start and end in a connected picker

**Common layouts:**
- Dashboard date range filter in a toolbar
- Report date selection
- Event creation form with start date and optional end date

---

## Drawer

**Also known as:** Tray, Flyout, Sheet

A panel that slides in from a screen edge to reveal secondary content or actions.

**Best practices:**
- Use drawers for secondary content or focused sub-tasks that don't warrant a full page
- Slide in from the right for detail panels, from the left for navigation
- Include a clear close button and support Escape to dismiss
- Dim the background with a semi-transparent overlay to establish focus
- Width should be 320-480 px on desktop; full-width on mobile

**Common layouts:**
- Detail/edit panel in a master-detail layout
- Notification center sliding in from the right
- Entity detail drawer with tabs for different data sections

---

## Dropdown menu

**Also known as:** Select menu

A menu triggered by a button that reveals a list of actions or navigation options.

**Best practices:**
- Group related items with separators and optional group headings
- Support keyboard navigation: arrow keys to move, Enter to select, Escape to close
- Keep the menu to 7+/-2 items; use sub-menus or search for longer lists
- Position the menu to avoid viewport overflow -- flip to top if near bottom edge
- Indicate destructive actions in red and place them last, separated

**Common layouts:**
- User account menu in the top-right navigation
- Action menu on a table row (Edit, Duplicate, Delete)
- Sort/filter dropdown in a toolbar

---

## Empty state

A placeholder shown when a view has no data to display.

**Best practices:**
- Include a clear illustration or icon to soften the empty feeling
- Write a helpful headline explaining the empty state
- Provide a primary CTA that guides the user toward the next step
- Avoid blame -- frame it positively ('No projects yet' not 'You have no projects')
- Show the empty state in-place within the container, not as a full-page takeover

**Common layouts:**
- Empty dashboard with 'Create your first project' CTA
- Search results page with 'No results found' and suggestions
- Empty table with inline prompt to add data

---

## Fieldset

A container that groups related form fields under a shared label or legend.

**Best practices:**
- Use fieldsets to group related form fields under a descriptive legend
- Style the legend as a section heading within the form
- Ensure the fieldset is announced by screen readers for context

**Common layouts:**
- Connection settings grouping host, port, database fields
- Personal details section in a multi-part form

---

## File upload

**Also known as:** File input, Dropzone

A control that lets users select and upload files.

**Best practices:**
- Support drag-and-drop with a clearly defined drop zone
- Show accepted file types and size limits before upload
- Display upload progress with a progress bar per file
- Allow cancellation of in-progress uploads
- Validate file type and size client-side before uploading

**Common layouts:**
- Document attachment area in a form
- Multi-file drag-and-drop zone with file list below
- CSV/JSON import for data loading

---

## Form

A collection of input controls for entering and submitting structured data.

**Best practices:**
- Use a single-column layout for most forms -- faster to scan
- Place labels above inputs for mobile-friendly forms
- Group related fields with visual proximity and optional fieldset headings
- Show inline validation on blur, not on every keystroke
- Disable the submit button until required fields are valid, or show clear errors on submit
- Keep forms as short as possible -- ask only what's necessary

**Common layouts:**
- Settings form with grouped preference sections
- Connection configuration form
- Multi-step wizard form with progress indicator
- Filter form in a sidebar

---

## Header

The persistent top-of-page region containing the brand, navigation, and key actions.

**Best practices:**
- Keep the header height compact (56-72 px) to preserve content space
- Place the logo/brand on the left, primary navigation in the center or right
- Use a sticky header on long pages but consider auto-hide on scroll-down
- Maintain clear visual separation from page content (border-bottom or subtle shadow)

**Common layouts:**
- Dashboard header with breadcrumbs, page title, and action buttons
- SaaS app header with logo, nav links, search, and user avatar
- Minimal header with entity selector and status indicators

---

## Heading

A title element that introduces and labels a content section.

**Best practices:**
- Use a strict heading hierarchy (h1 -> h2 -> h3) for accessibility and SEO
- Limit to one h1 per page -- it's the page title
- Keep headings concise and descriptive
- Use consistent sizing, weight, and spacing across heading levels

**Common layouts:**
- Page title (h1) with section headings (h2) and subsections (h3)
- Dashboard section headers separating widget groups
- Card title as an h3 within a page section

---

## Icon

A small graphic symbol communicating purpose or meaning at a glance.

**Best practices:**
- Use a consistent icon style throughout (outlined or filled, not mixed)
- Size icons to align with adjacent text (typically 16-24 px)
- Pair icons with text labels for clarity -- icon-only buttons need tooltips
- Use aria-hidden='true' for decorative icons and aria-label for functional ones

**Common layouts:**
- Navigation item with icon + label
- Action button with icon + text ('Download report')
- Status indicator icon beside a label (check, warning, error)
- Icon-only toolbar with tooltips

---

## Link

**Also known as:** Anchor, Hyperlink

A clickable reference to another resource.

**Best practices:**
- Make link text descriptive -- avoid 'click here' or 'learn more' in isolation
- Underline links in body text for discoverability; nav links may rely on context
- Use a distinct color from surrounding text
- External links should indicate they open in a new tab (icon or aria-label)

**Common layouts:**
- Inline text link within a paragraph
- Standalone link beneath a card as a 'read more' action
- Breadcrumb links in a hierarchy path

---

## List

A component grouping related items into an ordered or unordered sequence.

**Best practices:**
- Use consistent vertical rhythm -- equal spacing between list items
- For interactive lists, ensure each row has a clear hover and active state
- Include dividers between items in dense lists; omit them in spacious ones
- Support keyboard navigation when the list is interactive
- Use virtualization (windowing) for lists exceeding ~100 items

**Common layouts:**
- Activity feed with avatar, description, and relative timestamp
- Settings list with label, value/toggle, and optional chevron
- Entity list with icon, name, status, and actions

---

## Modal

**Also known as:** Dialog, Popup

An overlay that demands the user's attention before returning to the content beneath.

**Best practices:**
- Use modals sparingly -- only for actions requiring immediate attention or focused input
- Always provide a clear close mechanism: X button, Cancel, and Escape key
- Trap focus within the modal while open for accessibility
- Return focus to the trigger element when the modal closes
- Keep modal content concise -- if it needs scrolling, consider a full page instead
- Use a semi-transparent backdrop to dim the underlying content

**Common layouts:**
- Confirmation dialog with message and two action buttons
- Form modal for quick data entry (create, edit)
- Data lineage modal with tabs (technical/business views)
- Onboarding or announcement modal with illustration and CTA

---

## Navigation

**Also known as:** Nav, Menu

A region containing links for moving between pages or sections.

**Best practices:**
- Limit primary navigation to 5-7 items; group the rest under 'More' or sub-menus
- Clearly indicate the current/active page in the navigation
- Use consistent iconography alongside text labels for scannability
- Collapse to a hamburger or bottom tab bar on mobile
- Ensure all navigation items are reachable via keyboard (Tab + Enter)

**Common layouts:**
- Horizontal top nav with logo, links, and user menu
- Vertical sidebar navigation with icon + label and collapsible groups
- Dashboard tab navigation switching between views

---

## Pagination

A control for navigating between pages of content.

**Best practices:**
- Show first, last, and a window of pages around the current one
- Use ellipsis to indicate skipped pages, not dozens of page numbers
- Provide Previous/Next buttons in addition to numbered pages
- Clearly style the current page as selected
- Consider infinite scroll or 'Load more' for content feeds

**Common layouts:**
- Table footer with page numbers, rows-per-page selector, and total count
- Search results pagination centered below the results list
- Log/audit trail browsing

---

## Popover

A floating panel appearing on click near its trigger element -- unlike a tooltip, it can contain interactive content.

**Best practices:**
- Trigger via click, not hover, to support touch devices and accessibility
- Position intelligently to avoid clipping at viewport edges
- Include a subtle arrow/caret pointing to the trigger element
- Dismiss when clicking outside or pressing Escape
- Keep popover content brief -- it's not a modal

**Common layouts:**
- Metric tooltip with trend sparkline + context
- Quick-info hover card on a badge
- User profile preview card on avatar click
- Quick-edit popover for inline data modification

---

## Progress bar

**Also known as:** Progress

A horizontal indicator showing task progress toward completion.

**Best practices:**
- Show a determinate bar when progress is measurable, indeterminate when unknown
- Include a percentage label for accessibility and clarity
- Use color to indicate state: blue/green for normal, red for error, amber for warning
- Animate smoothly -- avoid jarring jumps between values
- Keep the bar visually proportional to its container

**Common layouts:**
- File upload progress beneath the file name
- Onboarding completion bar in a sidebar or header
- System resource usage bar in a monitoring dashboard
- Data processing pipeline progress

---

## Progress indicator

**Also known as:** Progress tracker, Stepper, Steps, Timeline

A visual display of advancement through a multi-step process.

**Best practices:**
- Clearly distinguish completed, current, and upcoming steps
- Use numbered or labeled steps -- not just dots
- Allow users to click back to completed steps if the flow permits
- Keep the total step count visible so users know the scope
- Vertically stack steps on mobile for readability

**Common layouts:**
- Multi-step wizard (Setup -> Configure -> Deploy -> Verify)
- Pipeline phase indicator
- Agent processing stages

---

## Radio button

**Also known as:** Radio, Radio group

A selection control for picking exactly one option from a set.

**Best practices:**
- Use radio buttons for mutually exclusive choices (select one from many)
- Always pre-select a sensible default when possible
- Group under a fieldset with a legend describing the choice
- Stack vertically for more than 2 options -- horizontal only for 2-3 short-label options
- Provide sufficient spacing between options (at least 8 px) for easy tapping

**Common layouts:**
- Configuration option selection (e.g., deployment target)
- Plan/tier selection in a settings form

---

## Search input

**Also known as:** Search

A text field designed for entering search queries.

**Best practices:**
- Place a magnifying glass icon inside the field to signal purpose
- Support Cmd/Ctrl+K as a global shortcut to focus the search
- Show recent searches and suggested queries in a dropdown
- Debounce input and show a loading indicator during server queries (200-300 ms)
- Provide a clear/reset button (x) once text is entered

**Common layouts:**
- Global search in the top navigation bar
- Command palette overlay (Cmd+K) with categorized results
- Inline search/filter above a data table

---

## Segmented control

**Also known as:** Toggle button group

A compact row of mutually exclusive options -- a hybrid of button groups, radio buttons, and tabs.

**Best practices:**
- Limit to 2-5 segments -- more options warrant tabs or a dropdown
- Use equal-width segments for visual balance
- Animate the selection indicator sliding between options
- Ensure the selected state has strong contrast against unselected

**Common layouts:**
- Map/list/grid view switcher
- Chart type selector (Line, Bar, Area)
- Time range toggle (1D, 1W, 1M, 1Y)

---

## Select

**Also known as:** Dropdown, Select input

A form input showing the current selection when collapsed, revealing options when expanded.

**Best practices:**
- Use native select for simple use cases (better accessibility and mobile UX)
- For custom selects, ensure full keyboard support and ARIA attributes
- Show a placeholder label ('Select an option...') when no value is chosen
- Group long option lists with optgroups or headings
- For searchable selects with many options, combine with combobox behavior

**Common layouts:**
- Sort-by dropdown in a table toolbar
- Role selector in a user management flow
- Region/category filter

---

## Separator

**Also known as:** Divider, Horizontal rule

A visual divider separating content sections.

**Best practices:**
- Use subtle, low-contrast separators -- they guide the eye, not dominate it
- Prefer spacing over separators when grouping is already clear
- Use horizontal rules between content sections, vertical rules between columns

**Common layouts:**
- Horizontal divider between list items or content sections
- Vertical separator between sidebar and main content
- Section divider with centered label

---

## Skeleton

**Also known as:** Skeleton loader

A low-fidelity placeholder mimicking the shape of content while it loads.

**Best practices:**
- Match the skeleton shape to the actual content layout as closely as possible
- Use a subtle shimmer/pulse animation to indicate loading -- not a spinner
- Avoid skeletons for very fast loads (<300 ms) -- they add visual noise
- Show skeleton immediately on navigation; replace atomically when data arrives
- Use muted, low-contrast colors for skeleton blocks

**Common layouts:**
- Card grid skeleton with metric placeholder and text lines
- List/feed skeleton with repeating row shapes
- Dashboard skeleton with chart placeholder and metric blocks

---

## Skip link

Hidden navigation links letting keyboard users jump directly to main content.

**Best practices:**
- Make it the first focusable element in the DOM
- Visually hidden until focused -- then clearly visible
- Link to the main content area with a descriptive label ('Skip to main content')

---

## Slider

**Also known as:** Range input

A draggable control for selecting a value within a defined range.

**Best practices:**
- Show the current value in a tooltip or adjacent label
- Use tick marks for discrete value sliders
- Support both dragging and clicking on the track to set value
- Ensure minimum touch target size for the thumb (44 px)
- Pair with a text input for precise value entry when needed

**Common layouts:**
- Threshold adjustment slider with dynamic preview
- Confidence/risk tolerance slider
- Date range slider for time-series filtering

---

## Spinner

**Also known as:** Loader, Loading

An animated indicator showing a background process is running.

**Best practices:**
- Show spinners only after a delay (~300 ms) to avoid flicker on fast responses
- Size proportionally to context: inline (16 px), button (20 px), page (40+ px)
- Use a single brand-consistent spinner design throughout the app
- Provide an aria-label or sr-only text for screen readers ('Loading...')
- Prefer skeleton screens over spinners when the layout is predictable

**Common layouts:**
- Inline spinner inside a button during form submission
- Small spinner beside a table cell during lazy-loaded data fetch
- Overlay spinner on a card while its content refreshes

---

## Stack

A layout utility applying uniform spacing between child components.

**Best practices:**
- Use a consistent spacing scale (4, 8, 12, 16, 24, 32, 48 px)
- Default to vertical stacking; support horizontal for inline element groups
- Use stack as a layout primitive to enforce consistent spacing

**Common layouts:**
- Vertical stack of form fields with uniform gap
- Horizontal stack of action buttons with gap
- Card content layout with vertical stack of title, description, and meta

---

## Table

**Also known as:** Data table

A structured grid of rows and columns for displaying data.

**Best practices:**
- Use a sticky header row for scrollable tables
- Right-align numeric columns for easy comparison
- Provide sortable column headers with clear sort direction indicators
- Alternate row colors (zebra striping) or use horizontal dividers for readability
- Include a bulk-select checkbox column for actionable tables
- Make tables horizontally scrollable on mobile rather than hiding columns

**Common layouts:**
- Admin data table with search, filters, sort, pagination, and row actions
- Financial ledger with date, description, amount, and running balance
- Leaderboard table with rank, name, avatar, and score
- Entity comparison table with metric columns

---

## Tabs

**Also known as:** Tabbed interface

Selectable labels that switch between content panels.

**Best practices:**
- Limit to 2-7 tabs; more options need a scrollable tab bar or dropdown overflow
- Clearly indicate the active tab with a bottom border, background fill, or bold text
- Use short, descriptive tab labels (1-2 words)
- Place tab content immediately below the tab bar with no visual gap
- Support keyboard navigation: arrow keys between tabs, Tab to content
- Consider swapping tabs for an accordion on narrow viewports

**Common layouts:**
- Settings page with General, Security, Notifications sections
- Dashboard with different report views (Overview, Analytics, Logs)
- Entity detail page with Activity, Data, and Config tabs

---

## Text input

A single-line form field for entering short text values.

**Best practices:**
- Use appropriate input types (email, tel, url, number) for mobile keyboard optimization
- Show placeholder text only as an example format, never as a label replacement
- Display character count for length-limited fields
- Show inline validation errors below the input with a red border and message
- Support autofill attributes for common fields (name, email, address)

**Common layouts:**
- Login form with email and password inputs
- Search bar with icon prefix and clear button
- Settings form with labeled text inputs in a single column

---

## Textarea

**Also known as:** Textbox

A multi-line text field for longer content entry.

**Best practices:**
- Allow vertical resizing but consider setting a min and max height
- Show character count if there's a limit
- Use a taller default height (3-5 rows) to signal multi-line input is expected
- Auto-grow the textarea as the user types for a smoother experience

**Common layouts:**
- Chat input for agent prompts
- Note-taking field in a detail panel
- Feedback form with a large message area

---

## Toast

**Also known as:** Snackbar

A brief, non-blocking notification in a floating layer above the interface.

**Best practices:**
- Auto-dismiss after 4-6 seconds for non-critical toasts
- Allow manual dismissal with a close button or swipe
- Stack multiple toasts with the newest on top
- Position in a consistent corner -- bottom-right is most common for desktop
- Include an action link for undoable operations ('Undo' for delete)
- Limit to one line of text -- toasts are for brief confirmations

**Common layouts:**
- Success toast after saving a form ('Changes saved')
- Error toast with retry action after a failed request
- Undo toast after deleting an item ('Item deleted. Undo')
- Action confirmation ('Intervention queued for execution')

---

## Toggle

**Also known as:** Switch, Lightswitch

A binary switch toggling between two states -- typically on and off.

**Best practices:**
- Use for binary on/off settings that take effect immediately
- Label the toggle with what it controls, not 'On/Off'
- Show the current state visually (color, position) and with an optional text label
- Size the toggle to be easily tappable (44+ px wide)
- Avoid using toggles inside forms that require a Save action -- use checkboxes instead

**Common layouts:**
- Settings row with label on the left and toggle on the right
- Dark mode toggle in a header or settings panel
- Feature flag toggles in an admin panel

---

## Tooltip

**Also known as:** Toggletip

A small floating label revealing supplementary information about an element, typically on hover.

**Best practices:**
- Use tooltips for supplementary info -- never for essential content
- Trigger on hover (desktop) and long-press (mobile); avoid click-to-show
- Show after a short delay (~300 ms) and hide on mouse leave
- Keep tooltip text to a single sentence or a few words
- Position to avoid obscuring the trigger element or important content
- Use a toggletip (click-triggered) when the content includes interactive elements

**Common layouts:**
- Icon button tooltip showing the action name
- Truncated text tooltip revealing the full string on hover
- Chart data point tooltip showing exact values
- Info icon tooltip explaining a metric or column

---

## Tree view

A collapsible, nested hierarchy for browsing structured data.

**Best practices:**
- Use indentation (16-24 px per level) to show hierarchy
- Include expand/collapse toggles (chevron or triangle) for parent nodes
- Support keyboard navigation: arrows to traverse, Enter to select, +/- to expand/collapse
- Highlight the selected node and show a focus indicator
- Lazy-load deep children for performance in large trees

**Common layouts:**
- Data lineage hierarchy (database -> schema -> table -> column)
- Category tree in a sidebar
- Organization chart or reporting hierarchy
- File/folder browser

---

## Visually hidden

**Also known as:** Screenreader only

Content hidden visually but accessible to screen readers and assistive technology.

**Best practices:**
- Use for screen-reader-only text that provides context visual users don't need
- Never use display:none or visibility:hidden -- use a clip-rect technique
- Apply to skip links, icon-only button labels, and form field instructions

**Common layouts:**
- Hidden label for an icon-only close button
- Screen-reader instructions for a complex widget
