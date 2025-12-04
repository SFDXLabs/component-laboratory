# Custom List View LWC Component

A modern, configurable Lightning Web Component that replaces the standard Salesforce list view with an enhanced, customizable UI.

**New improved UI**  
<img width="2472" height="1008" alt="Image" src="https://github.com/user-attachments/assets/8c2d4399-92a6-412c-a09f-ff53817f28bd" />

**Selectable rows with visual indicators**  
<img width="2476" height="1030" alt="Image" src="https://github.com/user-attachments/assets/10c27ae8-43b4-4339-aeb9-4e223833e99d" />

**Highly customisable**  
<img width="582" height="597" alt="Image" src="https://github.com/user-attachments/assets/fce81f92-867f-442a-8390-4939e460af36" />

## Features

### Core Features
- **Modern UI Design**: Clean, polished interface with smooth animations and hover effects
- **Fully Configurable**: All settings exposed through Lightning App Builder properties
- **Dynamic SOQL Queries**: Support for any object with `{recordId}` and `{currentUserId}` placeholders
- **Up to 10 Configurable Columns**: Each with custom labels and automatic field type detection
- **Smart Search**: Real-time filtering across text fields with debouncing
- **Sortable Columns**: Click-to-sort with ascending/descending toggle
- **Pagination**: Configurable records per page with intuitive navigation
- **Field Type Formatting**: Automatic formatting for dates, currency, percentages, booleans, emails, phones, and URLs
- **Relationship Field Support**: Display fields from related objects (e.g., `Account.Name`)
- **Export to CSV**: Built-in export functionality
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: ARIA labels and keyboard navigation support

### Selection & Bulk Actions
- **Selectable Rows**: Optional checkbox column for multi-record selection
- **Select All**: Header checkbox to select/deselect all records on current page
- **Change Owner**: Bulk action to change owner on selected records
- **User Search**: Search for users by name or email when changing owner
- **Selection Counter**: Visual indicator showing number of selected records

### Row Actions
- **Row Actions Menu**: Per-row dropdown menu with quick actions
- **View Record**: Navigate to record detail page
- **Edit Record**: Navigate to record edit page
- **Change Owner**: Change owner for individual record

### Quick Filters
- **Multi-Select Filters**: Filter bar with dropdown filters for picklist columns
- **Configurable Values**: Define which values appear in each filter
- **Multiple Selections**: Select multiple values per filter (uses OR logic)
- **Combined Filtering**: Multiple filters work together (uses AND logic)
- **Clear Filters**: Clear individual filters or all filters at once

## Installation

### Deploy to Salesforce

1. Clone this repository or copy the files
2. Deploy using Salesforce CLI:

```bash
sf project deploy start --source-dir force-app
```

Or use VS Code with Salesforce Extensions:
1. Right-click on the `force-app` folder
2. Select "SFDX: Deploy Source to Org"

### Files Structure

```
force-app/
└── main/
    └── default/
        ├── classes/
        │   ├── CustomListViewController.cls
        │   ├── CustomListViewController.cls-meta.xml
        │   ├── CustomListViewControllerTest.cls
        │   └── CustomListViewControllerTest.cls-meta.xml
        └── lwc/
            └── customListView/
                ├── customListView.html
                ├── customListView.js
                ├── customListView.css
                └── customListView.js-meta.xml
```

## Configuration Properties

Add the component to any Lightning page and configure it using the following properties:

### Core Configuration

| Property | Description | Type | Example |
|----------|-------------|------|---------|
| **SOQL Query** | Base query to return records. Use `{recordId}` for current record context or `{currentUserId}` for logged-in user | Text | `SELECT Id, Name, Email FROM Contact WHERE AccountId = {recordId}` |
| **List View Title** | Title displayed at the top | Text | `Related Contacts` |
| **List View Subtitle** | Smaller grey text below the title | Text | `Showing all active contacts for this account` |

### Query Placeholders

| Placeholder | Description | Example Usage |
|-------------|-------------|---------------|
| `{recordId}` | Replaced with the current record's ID (on record pages) | `WHERE AccountId = {recordId}` |
| `{currentUserId}` | Replaced with the logged-in user's ID | `WHERE OwnerId = {currentUserId}` |

### UI Customization

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| **Hover Row Color (Hex)** | Hex color for row hover highlight | Text | `#f0f7ff` |
| **Display Search Box** | Show/hide search functionality | Boolean | `true` |
| **Display Actions Button** | Show/hide actions menu | Boolean | `true` |
| **Selectable Rows** | Enable checkbox selection for bulk actions | Boolean | `false` |
| **Display Row Actions** | Show row-level action menu (View, Edit, Change Owner) | Boolean | `true` |

### Pagination & Sorting

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| **Records Per Page** | Records displayed per page (1-200) | Number | `20` |
| **Default Sort Column** | Field API name for default sorting | Text | _(blank)_ |
| **Allow User Sorting** | Allow users to change sort column | Boolean | `true` |

### Column Configuration (1-10)

Each column has five properties:

| Property | Description | Example |
|----------|-------------|---------|
| **Column X - Field API Name** | API name of the field | `Custom_Field__c`, `Account.Name` |
| **Column X - Custom Label** | Override default field label | `Customer Age` |
| **Column X - Display as Pill** | Show value as colored pill/badge | `true` |
| **Column X - Pill Color Mapping** | Map values to hex colors | `Won:#2e844a,Lost:#ba0517` |
| **Column X - Quick Filter Values** | Enable filter with comma-separated values | `Open,Closed,Pending` |

### Pill Color Mapping Format

The pill color mapping uses a simple format: `Value1:#hex1,Value2:#hex2`

- Values are case-insensitive
- Unmapped values display with a default gray pill
- Text color (white/dark) is automatically calculated for best contrast

**Example mappings:**
```
Won:#2e844a,Lost:#ba0517,Pending:#fe9339
Active:#0176d3,Inactive:#706e6b
High:#ba0517,Medium:#fe9339,Low:#2e844a
```

### Quick Filter Configuration

To enable quick filters for a column:

1. Set the **Quick Filter Values** property with comma-separated values
2. The filter dropdown will appear in the filter bar below the header
3. The label above each filter uses the Custom Label (if set) or the field's default label

**Example:**
```
Column 2 - Field API Name: Status__c
Column 2 - Custom Label: Status
Column 2 - Quick Filter Values: New,Open,In Progress,Closed,On Hold
```

**Filter Behavior:**
- Selecting multiple values in one filter uses OR logic (e.g., `Status IN ('Open', 'Pending')`)
- Multiple filters use AND logic between them (e.g., `Status = 'Open' AND Priority = 'High'`)
- Filters reset pagination to page 1

## Usage Examples

### Example 1: Contacts on Account Page

**SOQL Query:**
```sql
SELECT Id, Name, Email, Phone, Title, Department FROM Contact WHERE AccountId = {recordId}
```

**Configuration:**
- List View Title: `Related Contacts`
- Records Per Page: `15`
- Default Sort Column: `Name`
- Selectable Rows: `true`
- Column 1 Field: `Name`
- Column 2 Field: `Title`
- Column 3 Field: `Email`
- Column 4 Field: `Phone`
- Column 5 Field: `Department`

### Example 2: Opportunities with Status Pills and Filters

**SOQL Query:**
```sql
SELECT Id, Name, StageName, Amount, CloseDate, Account.Name FROM Opportunity WHERE OwnerId = {currentUserId}
```

**Configuration:**
- List View Title: `My Opportunities`
- Hover Row Color: `#e8f5e9`
- Selectable Rows: `true`
- Column 1 Field: `Name`
- Column 2 Field: `Account.Name`, Label: `Account`
- Column 3 Field: `StageName`, Label: `Stage`
  - Display as Pill: `true`
  - Pill Colors: `Closed Won:#2e844a,Closed Lost:#ba0517,Qualification:#0176d3,Proposal:#fe9339,Negotiation:#9050e9`
  - Quick Filter Values: `Qualification,Proposal,Negotiation,Closed Won,Closed Lost`
- Column 4 Field: `Amount`
- Column 5 Field: `CloseDate`, Label: `Close Date`

### Example 3: Cases with Priority Filters

**SOQL Query:**
```sql
SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate FROM Case WHERE IsClosed = false
```

**Configuration:**
- Display Search Box: `true`
- Selectable Rows: `true`
- Display Row Actions: `true`
- Records Per Page: `25`
- Column 1 Field: `CaseNumber`
- Column 2 Field: `Subject`
- Column 3 Field: `Status`
  - Quick Filter Values: `New,Working,Escalated,Closed`
- Column 4 Field: `Priority`
  - Display as Pill: `true`
  - Pill Colors: `High:#ba0517,Medium:#fe9339,Low:#2e844a`
  - Quick Filter Values: `High,Medium,Low`
- Column 5 Field: `CreatedDate`, Label: `Created`

### Example 4: Tasks Owned by Current User

**SOQL Query:**
```sql
SELECT Id, Subject, Status, Priority, ActivityDate, Who.Name FROM Task WHERE OwnerId = {currentUserId} AND IsClosed = false
```

**Configuration:**
- List View Title: `My Open Tasks`
- Selectable Rows: `true` (to bulk reassign tasks)
- Column 1 Field: `Subject`
- Column 2 Field: `Who.Name`, Label: `Related To`
- Column 3 Field: `Status`
  - Quick Filter Values: `Not Started,In Progress,Waiting on someone else,Deferred`
- Column 4 Field: `Priority`
- Column 5 Field: `ActivityDate`, Label: `Due Date`

## Supported Field Types

The component automatically detects and formats these field types:

| Field Type | Rendering |
|------------|-----------|
| Text/String | Plain text |
| Name | Clickable link to record |
| Boolean | Check/X icon |
| Currency | Formatted with currency symbol |
| Percent | Formatted with % symbol |
| Date | Localized date format |
| DateTime | Localized date and time |
| Email | Clickable mailto link |
| Phone | Clickable tel link |
| URL | Clickable link (shows domain) |
| Picklist | Plain text (or colored pill if enabled) |
| Relationship | Clickable link to related record |

### Pill Display Mode

Any column can be displayed as a colored pill by enabling "Display as Pill" and providing color mappings. This is ideal for:
- Status fields (Active/Inactive)
- Stage fields (Won/Lost/Pending)
- Priority fields (High/Medium/Low)
- Any picklist where visual distinction helps

## Bulk Actions

### Change Owner

When **Selectable Rows** is enabled:

1. Select one or more records using the checkboxes
2. Click the **Change Owner** button in the header (or use the row action menu for single records)
3. Search for a user by name or email
4. Select the new owner from the results
5. Click **Confirm** to update all selected records

**Features:**
- Partial success handling (reports how many succeeded/failed)
- Works with any object that has an `OwnerId` field
- User search shows name, email, and title
- Minimum 2 characters required for user search

## Row Actions

When **Display Row Actions** is enabled (default), each row shows a dropdown menu with:

| Action | Description |
|--------|-------------|
| **View Record** | Navigate to the record's detail page |
| **Edit Record** | Navigate to the record's edit page |
| **Change Owner** | Open the Change Owner modal for this single record |

To disable row actions, set **Display Row Actions** to `false` in the component properties.

## Customization

### Changing Colors

Edit the CSS custom properties in `customListView.css`:

```css
:host {
    --primary-color: #0176d3;      /* Links and active elements */
    --primary-hover: #014486;      /* Link hover state */
    --text-primary: #181818;       /* Main text color */
    --text-secondary: #444444;     /* Secondary text */
    --text-muted: #706e6b;         /* Muted/subtle text */
    --border-color: #e5e5e5;       /* Borders */
    --border-radius: 8px;          /* Corner rounding */
    --background-light: #fafaf9;   /* Light background */
    --background-white: #ffffff;   /* White background */
    --selection-color: #e8f4fd;    /* Selected row background */
    --selection-border: #0176d3;   /* Selected row left border */
}
```

### Adding New Bulk Actions

1. Add a new menu item in `customListView.html` (inside the actions menu):

```html
<lightning-menu-item value="myBulkAction" label="My Bulk Action" disabled={noSelectedRecords}></lightning-menu-item>
```

2. Handle the action in `customListView.js`:

```javascript
handleActionSelect(event) {
    const selectedAction = event.detail.value;
    
    switch (selectedAction) {
        case 'refresh':
            this.loadData();
            break;
        case 'export':
            this.exportToCSV();
            break;
        case 'changeOwner':
            this.openChangeOwnerModal();
            break;
        case 'myBulkAction':
            this.handleMyBulkAction();
            break;
    }
}

handleMyBulkAction() {
    const selectedIds = Array.from(this.selectedRecordIds);
    // Your custom logic here
}
```

### Adding New Row Actions

1. Add a menu item in the row actions template:

```html
<lightning-menu-item 
    value="myRowAction" 
    label="My Action"
    icon-name="utility:custom_icon">
</lightning-menu-item>
```

2. Handle the action in `handleRowActionSelect`:

```javascript
handleRowActionSelect(event) {
    const actionValue = event.detail.value;
    const recordId = event.target.dataset.recordId;
    
    switch (actionValue) {
        case 'view':
            this.viewRecord(recordId);
            break;
        case 'edit':
            this.editRecord(recordId);
            break;
        case 'changeOwner':
            this.openChangeOwnerForSingleRecord(recordId);
            break;
        case 'myRowAction':
            this.handleMyRowAction(recordId);
            break;
    }
}
```

## Troubleshooting

### "Could not determine object name from query"
- Ensure your SOQL query follows standard syntax with `FROM ObjectName`

### Records not appearing
- Check that the query returns data in Developer Console
- Verify the column Field API Names match fields in your SELECT clause
- Ensure the running user has access to the object and fields

### {recordId} not working
- This only works on Record Pages
- Ensure the record page has a valid record context

### {currentUserId} not working
- Verify the SOQL syntax: `WHERE OwnerId = {currentUserId}` (no quotes needed)

### Search not finding records
- Search only works on text-compatible fields (String, Email, Phone, URL, Picklist)
- The field must be included in your SOQL query

### Quick filters not showing
- Ensure you've entered values in the **Quick Filter Values** property
- Values should be comma-separated (e.g., `Open,Closed,Pending`)
- The filter bar only appears when at least one column has filter values configured

### Change Owner not working
- The object must have an `OwnerId` field
- The user must have permission to modify records
- The target user must be active

### Filters returning no results
- Check that filter values exactly match the field values in your data
- Verify the field API name is correct
- Check the browser console for any error messages

## License

MIT License - feel free to use and modify for your projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
