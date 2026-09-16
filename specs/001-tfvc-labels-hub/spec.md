# Feature Specification: TFVC Labels Hub

**Feature Branch**: `001-tfvc-labels-hub`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Create an Azure Devops TFVC Lables hub extension, the extension contains 2 pages.
* the main page will show a list of all the TFVC labels of the team project
  with a filter bar for free text and a drop box to select label creators
  click on the row will open the second page
  each row will constitsts of 2 lines
  * first row - Label name
  * 2nd row- created date for label and creator persona icon with display name
* label details page - the page consists of 3 main sections:
  * page header contains a back button to previous page and the label name
  * label description with edit functionality
  * label contents contains 2 obejcts:
    * label folders tree on the left side
    * label folder node contents on the right side, showing files and folders, which are updated when selecting a new node on the left"

## Clarifications

### Session 2026-09-16

- Q: Since Azure DevOps' public TFVC REST API has no operation to update a label's description, how should the edit feature (User Story 3) behave? → A: Remove edit feature from v1 (read-only description).
- Q: What should the main page's free-text filter bar match against? → A: Label name + description.
- Q: Who should be allowed to edit a label's description overlay? → A: Same as TFVC label edit permission (recorded for a possible future release; moot for v1 since description editing is deferred per the first answer above).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Filter TFVC Labels (Priority: P1)

As a team project member, I want to see a list of all TFVC labels in the team project, so I can quickly find a label of interest without navigating the source control history manually.

**Why this priority**: This is the entry point of the extension and the only way for users to discover labels. Without it, no other functionality is reachable.

**Independent Test**: Can be fully tested by opening the extension's main page and verifying that all TFVC labels for the current team project are displayed with name, created date, and creator, delivering immediate value as a label browsing tool even without the details page.

**Acceptance Scenarios**:

1. **Given** a team project with existing TFVC labels, **When** the user opens the main page, **Then** all labels are listed, each showing the label name on the first line and the created date plus creator persona icon and display name on the second line.
2. **Given** the label list is displayed, **When** the user types text into the free-text filter bar, **Then** only labels whose name or description matches the entered text remain visible.
3. **Given** the label list is displayed, **When** the user selects a creator from the creator drop-down, **Then** only labels created by that person remain visible.
4. **Given** both a free-text filter and a creator filter are set, **When** the user views the list, **Then** only labels matching both conditions are shown.
5. **Given** no labels match the current filter criteria, **When** the user views the list, **Then** an empty-state message is shown instead of an empty list with no explanation.

---

### User Story 2 - View Label Details (Priority: P1)

As a team project member, I want to click a label in the list and see its full details, so I can understand what the label represents and what it contains.

**Why this priority**: Viewing details is the primary value delivered after browsing; it is equally essential to the browsing experience and together they form the MVP.

**Independent Test**: Can be fully tested by clicking any row in the label list and verifying the details page opens showing the correct label's name, description, and folder contents, and that the back button returns to the main list.

**Acceptance Scenarios**:

1. **Given** the main page is showing the label list, **When** the user clicks on a label row, **Then** the label details page opens for that specific label.
2. **Given** the label details page is open, **When** it loads, **Then** the page header shows a back button and the selected label's name.
3. **Given** the label details page is open, **When** the user clicks the back button, **Then** the user returns to the main label list page with previously applied filters preserved.
4. **Given** the label details page is open, **When** it loads, **Then** the label description section displays the label's current description text, read-only, (or an indication that no description is set).

---

### User Story 3 - Explore Label Folder Contents (Priority: P2)

As a team project member, I want to browse the folder tree of a label and view the files/folders under a selected node, so I can inspect exactly what was captured in the label without leaving the extension.

**Why this priority**: This is core "contents" functionality of a label but depends on the details page (User Story 2) already being available; it deepens the value of the details page.

**Independent Test**: Can be fully tested by opening a label's details page, selecting different nodes in the folder tree, and verifying the right-hand content panel updates to show the files and folders under the newly selected node.

**Acceptance Scenarios**:

1. **Given** the label details page is open, **When** the label contents section loads, **Then** a folder tree is displayed on the left representing the label's top-level folder structure.
2. **Given** the folder tree is displayed, **When** the user selects a folder node, **Then** the right-hand panel updates to show the files and sub-folders contained directly under that node.
3. **Given** a folder node is selected, **When** the user selects a different node, **Then** the right-hand panel content refreshes to reflect the newly selected node, replacing the previous content.
4. **Given** a selected folder node has no files or sub-folders, **When** the right-hand panel updates, **Then** an empty-state message is shown.

---

### Edge Cases

- What happens when the team project has zero TFVC labels? The main page shows an empty-state message explaining no labels exist.
- What happens when the label list or a label's contents fail to load due to a service/network error? The affected section shows an error state with an option to retry.
- What happens when a label is deleted or renamed by another user while a user has its details page open? Attempting to refresh contents surfaces an error indicating the label is no longer available.
- What happens when the creator drop-down has a very large number of distinct creators? The drop-down supports search/typeahead to locate a creator quickly.
- What happens when a label description contains a very long text? The description section supports scrolling/expansion rather than clipping content silently.
- What happens when a folder node contains a very large number of files/folders? The right-hand panel paginates or virtualizes the list rather than loading everything at once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list of all TFVC labels defined in the current team project on the main page.
- **FR-002**: System MUST show, for each label row, the label name on the first line and the created date together with the creator's persona icon and display name on the second line.
- **FR-003**: System MUST provide a free-text filter bar on the main page that filters the visible labels by matching the entered text against the label name or description.
- **FR-004**: System MUST provide a drop-down control on the main page listing distinct label creators, allowing the user to filter the visible labels to only those created by the selected creator.
- **FR-005**: System MUST allow the free-text filter and creator filter to be applied simultaneously, showing only labels matching both.
- **FR-006**: System MUST navigate to the label details page when a user clicks on a label row in the main page.
- **FR-007**: System MUST display a page header on the label details page containing a back button and the name of the currently viewed label.
- **FR-008**: The back button MUST return the user to the main label list page, preserving previously applied filters.
- **FR-009**: System MUST display the label's description on the details page as read-only text (editing is out of scope for this release; see Clarifications).
- **FR-010**: System MUST display a folder tree representing the label's folder structure on the left side of the label contents section.
- **FR-011**: System MUST display, on the right side of the label contents section, the files and folders contained directly under the folder node currently selected in the tree.
- **FR-012**: System MUST update the right-hand content panel whenever the user selects a different node in the folder tree.
- **FR-013**: System MUST show an appropriate empty-state message when the label list, a selected folder node, or the creator filter has no matching data.
- **FR-014**: System MUST show an appropriate error state, with the ability to retry, when data required for the main page or details page fails to load.

### Key Entities

- **TFVC Label**: Represents a named snapshot of TFVC source control paths at a point in time. Key attributes: name, description, created date, creator (identity/display name/avatar), and the set of labeled paths/items.
- **Label Creator**: An identity (team project member) who created one or more labels. Key attributes: display name, persona/avatar, unique identifier, used to populate the creator filter drop-down.
- **Label Folder Node**: Represents a folder within a label's captured path structure. Key attributes: path, name, parent node, child nodes.
- **Label Item**: Represents a file or folder listed directly under a label folder node. Key attributes: name, type (file/folder), path.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate a specific label among 200+ labels in under 15 seconds using the free-text (name/description) and/or creator filters.
- **SC-002**: Users can navigate from the main label list to a label's details page and back in 2 clicks or fewer.
- **SC-003**: Users can inspect the contents of any folder within a label's structure in 3 clicks or fewer from the details page.
- **SC-004**: The main label list and label details page each visibly render initial content (or an explicit loading/empty/error state) within 3 seconds under normal network conditions.

## Assumptions

- The extension operates within the context of a single, currently-selected Azure DevOps team project that uses TFVC as its version control system.
- Users are already authenticated to Azure DevOps; the extension relies on the host's existing authentication/authorization rather than implementing its own.
- Editing a label's description is out of scope for this release because Azure DevOps' public TFVC REST API does not support updating a label; the description is displayed read-only (see Clarifications). A future release could revisit this, gated on the same permissions Azure DevOps already enforces for TFVC label management (e.g., label owner or project administrator).
- The list of label creators shown in the drop-down is derived from the creators of the labels actually present in the team project (not all team project members).
- "Label contents" refers to the paths/items captured in the label at creation time, browsable as a folder/file tree, rather than the full version history of those items.
- Filtering and sorting are client-side conveniences over the full set of labels; large-scale server-side pagination is out of scope for the initial version unless label volume proves this insufficient.
- Mobile/responsive layouts are out of scope for v1; the extension targets the standard Azure DevOps web hub desktop experience.
