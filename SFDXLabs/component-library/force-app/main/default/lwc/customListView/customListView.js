import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import executeQuery from '@salesforce/apex/CustomListViewController.executeQuery';
import changeRecordsOwner from '@salesforce/apex/CustomListViewController.changeRecordsOwner';
import searchUsers from '@salesforce/apex/CustomListViewController.searchUsers';

export default class CustomListView extends NavigationMixin(LightningElement) {
    // ═══════════════════════════════════════════════════════════════════
    // API Properties - Exposed to Lightning App Builder
    // ═══════════════════════════════════════════════════════════════════
    
    @api recordId; // Current record context
    @api soqlQuery = '';
    @api listViewTitle = 'List View';
    @api listViewSubtitle = '';
    @api hoverRowColorHex = '#f0f7ff';
    @api displaySearchBox = false;
    @api displayActionsButton = false;
    @api recordCountPerPage = 20;
    @api defaultSortableColumn = '';
    @api allowUserSort = false;
    @api selectableRows = false; // Enable row selection with checkboxes
    @api displayRowActions = false; // Display row actions menu (View, Edit, Change Owner)
    
    // Column configurations (up to 10 columns)
    @api column1FieldApiName = '';
    @api column1UiLabel = '';
    @api column1DisplayAsPill = false;
    @api column1PillColors = '';
    @api column1FilterValues = '';
    
    @api column2FieldApiName = '';
    @api column2UiLabel = '';
    @api column2DisplayAsPill = false;
    @api column2PillColors = '';
    @api column2FilterValues = '';
    
    @api column3FieldApiName = '';
    @api column3UiLabel = '';
    @api column3DisplayAsPill = false;
    @api column3PillColors = '';
    @api column3FilterValues = '';
    
    @api column4FieldApiName = '';
    @api column4UiLabel = '';
    @api column4DisplayAsPill = false;
    @api column4PillColors = '';
    @api column4FilterValues = '';
    
    @api column5FieldApiName = '';
    @api column5UiLabel = '';
    @api column5DisplayAsPill = false;
    @api column5PillColors = '';
    @api column5FilterValues = '';
    
    @api column6FieldApiName = '';
    @api column6UiLabel = '';
    @api column6DisplayAsPill = false;
    @api column6PillColors = '';
    @api column6FilterValues = '';
    
    @api column7FieldApiName = '';
    @api column7UiLabel = '';
    @api column7DisplayAsPill = false;
    @api column7PillColors = '';
    @api column7FilterValues = '';
    
    @api column8FieldApiName = '';
    @api column8UiLabel = '';
    @api column8DisplayAsPill = false;
    @api column8PillColors = '';
    @api column8FilterValues = '';
    
    @api column9FieldApiName = '';
    @api column9UiLabel = '';
    @api column9DisplayAsPill = false;
    @api column9PillColors = '';
    @api column9FilterValues = '';
    
    @api column10FieldApiName = '';
    @api column10UiLabel = '';
    @api column10DisplayAsPill = false;
    @api column10PillColors = '';
    @api column10FilterValues = '';
    
    // ═══════════════════════════════════════════════════════════════════
    // Tracked Properties
    // ═══════════════════════════════════════════════════════════════════
    
    @track records = [];
    @track totalRecords = 0;
    @track currentPage = 1;
    @track sortField = '';
    @track sortDirection = 'ASC';
    @track searchTerm = '';
    @track isLoading = false;
    @track errorMessage = '';
    @track fieldMetadata = {};
    
    // Selection tracking
    @track selectedRecordIds = new Set();
    @track allSelectedOnPage = false;
    
    // Quick Filters
    @track activeFilters = {}; // { fieldName: ['value1', 'value2'], ... }
    @track openFilterDropdown = null; // Track which filter dropdown is open
    
    // Change Owner Modal
    @track showChangeOwnerModal = false;
    @track userSearchTerm = '';
    @track userSearchResults = [];
    @track selectedNewOwner = null;
    @track isSearchingUsers = false;
    @track isChangingOwner = false;
    
    // Debounce timers
    searchTimeout;
    userSearchTimeout;
    
    // ═══════════════════════════════════════════════════════════════════
    // Lifecycle Hooks
    // ═══════════════════════════════════════════════════════════════════
    
    connectedCallback() {
        // Set default sort field
        if (this.defaultSortableColumn) {
            this.sortField = this.defaultSortableColumn;
        }
        // Initial data load
        this.loadData();
        
        // Add document click listener to close filter dropdowns
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        document.addEventListener('click', this.handleDocumentClick);
    }
    
    disconnectedCallback() {
        // Remove document click listener
        document.removeEventListener('click', this.handleDocumentClick);
    }
    
    handleDocumentClick(event) {
        // Close filter dropdown when clicking outside
        if (this.openFilterDropdown) {
            const filterBar = this.template.querySelector('.filter-bar');
            if (filterBar && !filterBar.contains(event.target)) {
                this.openFilterDropdown = null;
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Computed Properties
    // ═══════════════════════════════════════════════════════════════════
    
    get containerStyle() {
        return `--hover-color: ${this.hoverRowColorHex || '#f0f7ff'};`;
    }
    
    get rowHoverStyle() {
        return `--row-hover-color: ${this.hoverRowColorHex || '#f0f7ff'};`;
    }
    
    get recordCountLabel() {
        if (this.totalRecords === 0) return 'No records';
        if (this.totalRecords === 1) return '1 record';
        return `${this.totalRecords} records`;
    }
    
    get hasSubtitle() {
        return this.listViewSubtitle && this.listViewSubtitle.trim().length > 0;
    }
    
    get hasRecords() {
        return !this.isLoading && !this.errorMessage && this.records && this.records.length > 0;
    }
    
    get showEmptyState() {
        return !this.isLoading && !this.errorMessage && (!this.records || this.records.length === 0);
    }
    
    // Selection computed properties
    get hasSelectedRecords() {
        return this.selectedRecordIds.size > 0;
    }
    
    get noSelectedRecords() {
        return this.selectedRecordIds.size === 0;
    }
    
    get selectedCount() {
        return this.selectedRecordIds.size;
    }
    
    get selectedCountLabel() {
        const count = this.selectedRecordIds.size;
        if (count === 0) return '';
        if (count === 1) return '1 selected';
        return `${count} selected`;
    }
    
    get showSelectionActions() {
        return this.selectableRows && this.hasSelectedRecords;
    }
    
    // Quick Filter computed properties
    get filterConfigurations() {
        const filters = [];
        const columnConfigs = [
            { field: this.column1FieldApiName, label: this.column1UiLabel, filterValues: this.column1FilterValues },
            { field: this.column2FieldApiName, label: this.column2UiLabel, filterValues: this.column2FilterValues },
            { field: this.column3FieldApiName, label: this.column3UiLabel, filterValues: this.column3FilterValues },
            { field: this.column4FieldApiName, label: this.column4UiLabel, filterValues: this.column4FilterValues },
            { field: this.column5FieldApiName, label: this.column5UiLabel, filterValues: this.column5FilterValues },
            { field: this.column6FieldApiName, label: this.column6UiLabel, filterValues: this.column6FilterValues },
            { field: this.column7FieldApiName, label: this.column7UiLabel, filterValues: this.column7FilterValues },
            { field: this.column8FieldApiName, label: this.column8UiLabel, filterValues: this.column8FilterValues },
            { field: this.column9FieldApiName, label: this.column9UiLabel, filterValues: this.column9FilterValues },
            { field: this.column10FieldApiName, label: this.column10UiLabel, filterValues: this.column10FilterValues }
        ];
        
        for (const config of columnConfigs) {
            if (config.field && config.filterValues) {
                const values = config.filterValues.split(',').map(v => v.trim()).filter(v => v);
                if (values.length > 0) {
                    const metadata = this.fieldMetadata[config.field] || {};
                    const filterLabel = config.label || metadata.label || config.field;
                    const selectedValues = this.activeFilters[config.field] || [];
                    const fieldName = config.field;
                    
                    // Include fieldName in each option to avoid nested scope issues in template
                    const options = values.map(val => ({
                        label: val,
                        value: val,
                        isChecked: selectedValues.includes(val),
                        fieldName: fieldName,
                        optionKey: `${fieldName}-${val}`
                    }));
                    
                    // Determine display text for the dropdown button
                    let buttonLabel;
                    if (selectedValues.length === 0) {
                        buttonLabel = 'All';
                    } else if (selectedValues.length === 1) {
                        buttonLabel = selectedValues[0];
                    } else {
                        buttonLabel = `${selectedValues.length} selected`;
                    }
                    
                    filters.push({
                        fieldName: fieldName,
                        label: filterLabel,
                        options: options,
                        selectedValues: selectedValues,
                        buttonLabel: buttonLabel,
                        hasSelections: selectedValues.length > 0,
                        isOpen: this.openFilterDropdown === fieldName
                    });
                }
            }
        }
        
        return filters;
    }
    
    get hasQuickFilters() {
        return this.filterConfigurations.length > 0;
    }
    
    get hasActiveFilters() {
        return Object.values(this.activeFilters).some(v => Array.isArray(v) && v.length > 0);
    }
    
    get activeFilterCount() {
        return Object.values(this.activeFilters).filter(v => Array.isArray(v) && v.length > 0).length;
    }
    
    get columns() {
        const cols = [];
        const columnConfigs = [
            { field: this.column1FieldApiName, label: this.column1UiLabel, displayAsPill: this.column1DisplayAsPill, pillColors: this.column1PillColors },
            { field: this.column2FieldApiName, label: this.column2UiLabel, displayAsPill: this.column2DisplayAsPill, pillColors: this.column2PillColors },
            { field: this.column3FieldApiName, label: this.column3UiLabel, displayAsPill: this.column3DisplayAsPill, pillColors: this.column3PillColors },
            { field: this.column4FieldApiName, label: this.column4UiLabel, displayAsPill: this.column4DisplayAsPill, pillColors: this.column4PillColors },
            { field: this.column5FieldApiName, label: this.column5UiLabel, displayAsPill: this.column5DisplayAsPill, pillColors: this.column5PillColors },
            { field: this.column6FieldApiName, label: this.column6UiLabel, displayAsPill: this.column6DisplayAsPill, pillColors: this.column6PillColors },
            { field: this.column7FieldApiName, label: this.column7UiLabel, displayAsPill: this.column7DisplayAsPill, pillColors: this.column7PillColors },
            { field: this.column8FieldApiName, label: this.column8UiLabel, displayAsPill: this.column8DisplayAsPill, pillColors: this.column8PillColors },
            { field: this.column9FieldApiName, label: this.column9UiLabel, displayAsPill: this.column9DisplayAsPill, pillColors: this.column9PillColors },
            { field: this.column10FieldApiName, label: this.column10UiLabel, displayAsPill: this.column10DisplayAsPill, pillColors: this.column10PillColors }
        ];
        
        for (const config of columnConfigs) {
            if (config.field) {
                const metadata = this.fieldMetadata[config.field] || {};
                const isSorted = this.sortField === config.field;
                
                // Parse pill color mappings
                const pillColorMap = this.parsePillColors(config.pillColors);
                
                cols.push({
                    fieldName: config.field,
                    label: config.label || metadata.label || config.field,
                    type: metadata.type || 'STRING',
                    sortable: metadata.sortable !== false,
                    sortIcon: isSorted 
                        ? (this.sortDirection === 'ASC' ? 'utility:arrowup' : 'utility:arrowdown')
                        : 'utility:sort',
                    sortButtonClass: isSorted ? 'sort-button active' : 'sort-button',
                    sortTitle: `Sort by ${config.label || metadata.label || config.field}`,
                    displayAsPill: config.displayAsPill,
                    pillColorMap: pillColorMap
                });
            }
        }
        
        return cols;
    }
    
    /**
     * Parses pill color configuration string into a map
     * Format: "Value1:#hex1,Value2:#hex2"
     */
    parsePillColors(colorString) {
        const colorMap = new Map();
        if (!colorString) return colorMap;
        
        try {
            const mappings = colorString.split(',');
            for (const mapping of mappings) {
                const [value, color] = mapping.split(':').map(s => s.trim());
                if (value && color) {
                    colorMap.set(value.toLowerCase(), color);
                }
            }
        } catch (e) {
            console.warn('Error parsing pill colors:', e);
        }
        
        return colorMap;
    }
    
    /**
     * Gets the pill color for a value, with fallback to default
     */
    getPillColor(value, colorMap) {
        if (!value || !colorMap || colorMap.size === 0) {
            return { background: '#e5e5e5', text: '#444444' }; // Default gray
        }
        
        const normalizedValue = String(value).toLowerCase();
        const color = colorMap.get(normalizedValue);
        
        if (color) {
            // Calculate contrasting text color (white or dark based on background)
            const textColor = this.getContrastingTextColor(color);
            return { background: color, text: textColor };
        }
        
        return { background: '#e5e5e5', text: '#444444' }; // Default gray
    }
    
    /**
     * Calculates whether text should be light or dark based on background color
     */
    getContrastingTextColor(hexColor) {
        // Remove # if present
        const hex = hexColor.replace('#', '');
        
        // Parse RGB values
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return white for dark backgrounds, dark for light backgrounds
        return luminance > 0.5 ? '#181818' : '#ffffff';
    }
    
    get displayRecords() {
        if (!this.records) return [];
        
        return this.records.map(record => {
            const displayFields = this.columns.map((column, index) => {
                const fieldValue = this.getFieldValue(record, column.fieldName);
                const fieldType = column.type;
                
                // Handle pill display
                let isPill = false;
                let pillStyle = '';
                if (column.displayAsPill && fieldValue) {
                    isPill = true;
                    const pillColors = this.getPillColor(fieldValue, column.pillColorMap);
                    pillStyle = `background-color: ${pillColors.background}; color: ${pillColors.text};`;
                }
                
                return {
                    key: `${record.Id}-${column.fieldName}-${index}`,
                    fieldName: column.fieldName,
                    rawValue: fieldValue,
                    displayValue: this.formatValue(fieldValue, fieldType),
                    isLink: this.isLinkField(column, record) && !isPill,
                    linkUrl: this.getLinkUrl(column, record),
                    linkRecordId: this.getLinkRecordId(column, record),
                    isBoolean: fieldType === 'BOOLEAN' && !isPill,
                    booleanIcon: fieldValue ? 'utility:check' : 'utility:close',
                    booleanClass: fieldValue ? 'boolean-true' : 'boolean-false',
                    isCurrency: fieldType === 'CURRENCY' && !isPill,
                    isPercent: fieldType === 'PERCENT' && !isPill,
                    isDate: fieldType === 'DATE' && !isPill,
                    isDateTime: fieldType === 'DATETIME' && !isPill,
                    isEmail: fieldType === 'EMAIL' && !isPill,
                    emailHref: fieldValue ? `mailto:${fieldValue}` : '',
                    isPhone: fieldType === 'PHONE' && !isPill,
                    phoneHref: fieldValue ? `tel:${fieldValue}` : '',
                    isUrl: fieldType === 'URL' && !isPill,
                    urlDisplay: this.truncateUrl(fieldValue),
                    isPill: isPill,
                    pillStyle: pillStyle
                };
            });
            
            return {
                Id: record.Id,
                displayFields,
                isSelected: this.selectedRecordIds.has(record.Id),
                rowClass: this.selectedRecordIds.has(record.Id) ? 'table-row selected-row' : 'table-row'
            };
        });
    }
    
    // Pagination computed properties
    get totalPages() {
        return Math.ceil(this.totalRecords / this.recordCountPerPage) || 1;
    }
    
    get showPagination() {
        return this.totalRecords > this.recordCountPerPage;
    }
    
    get isFirstPage() {
        return this.currentPage <= 1;
    }
    
    get isLastPage() {
        return this.currentPage >= this.totalPages;
    }
    
    get paginationStartRecord() {
        return ((this.currentPage - 1) * this.recordCountPerPage) + 1;
    }
    
    get paginationEndRecord() {
        const end = this.currentPage * this.recordCountPerPage;
        return end > this.totalRecords ? this.totalRecords : end;
    }
    
    // Change Owner Modal computed properties
    get hasUserSearchResults() {
        return this.userSearchResults && this.userSearchResults.length > 0;
    }
    
    get canConfirmOwnerChange() {
        return this.selectedNewOwner !== null && !this.isChangingOwner;
    }
    
    get isConfirmOwnerChangeDisabled() {
        return this.selectedNewOwner === null || this.isChangingOwner;
    }
    
    get changeOwnerButtonLabel() {
        return this.isChangingOwner ? 'Changing...' : 'Change Owner';
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Data Loading
    // ═══════════════════════════════════════════════════════════════════
    
    async loadData() {
        if (!this.soqlQuery) {
            this.errorMessage = 'Please configure a SOQL query for this component.';
            return;
        }
        
        this.isLoading = true;
        this.errorMessage = '';
        
        try {
            // Build filters map for Apex
            const filtersJson = JSON.stringify(this.activeFilters);
            
            const result = await executeQuery({
                soqlQuery: this.soqlQuery,
                recordId: this.recordId || '',
                searchTerm: this.searchTerm || '',
                sortField: this.sortField || '',
                sortDirection: this.sortDirection,
                pageSize: this.recordCountPerPage,
                pageNumber: this.currentPage,
                filtersJson: filtersJson
            });
            
            if (result.success) {
                this.records = result.records || [];
                this.totalRecords = result.totalCount || 0;
                this.fieldMetadata = result.fieldMetadata || {};
                this.updateAllSelectedState();
            } else {
                this.errorMessage = result.errorMessage || 'An error occurred while loading data.';
                this.records = [];
                this.totalRecords = 0;
            }
        } catch (error) {
            this.errorMessage = this.extractErrorMessage(error);
            this.records = [];
            this.totalRecords = 0;
        } finally {
            this.isLoading = false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Selection Handlers
    // ═══════════════════════════════════════════════════════════════════
    
    handleSelectAll(event) {
        const isChecked = event.target.checked;
        
        if (isChecked) {
            // Select all records on current page
            this.records.forEach(record => {
                this.selectedRecordIds.add(record.Id);
            });
        } else {
            // Deselect all records on current page
            this.records.forEach(record => {
                this.selectedRecordIds.delete(record.Id);
            });
        }
        
        // Trigger reactivity
        this.selectedRecordIds = new Set(this.selectedRecordIds);
        this.allSelectedOnPage = isChecked;
    }
    
    handleRowSelect(event) {
        event.stopPropagation();
        const recordId = event.target.dataset.id;
        const isChecked = event.target.checked;
        
        if (isChecked) {
            this.selectedRecordIds.add(recordId);
        } else {
            this.selectedRecordIds.delete(recordId);
        }
        
        // Trigger reactivity
        this.selectedRecordIds = new Set(this.selectedRecordIds);
        this.updateAllSelectedState();
    }
    
    updateAllSelectedState() {
        if (!this.records || this.records.length === 0) {
            this.allSelectedOnPage = false;
            return;
        }
        
        this.allSelectedOnPage = this.records.every(record => 
            this.selectedRecordIds.has(record.Id)
        );
    }
    
    clearSelection() {
        this.selectedRecordIds = new Set();
        this.allSelectedOnPage = false;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Quick Filter Handlers
    // ═══════════════════════════════════════════════════════════════════
    
    toggleFilterDropdown(event) {
        event.stopPropagation();
        const fieldName = event.currentTarget.dataset.field;
        
        if (this.openFilterDropdown === fieldName) {
            this.openFilterDropdown = null;
        } else {
            this.openFilterDropdown = fieldName;
        }
    }
    
    handleFilterOptionChange(event) {
        event.stopPropagation();
        const checkbox = event.target;
        const fieldName = checkbox.dataset.field;
        const value = checkbox.dataset.value;
        const isChecked = checkbox.checked;
        
        // Defensive check
        if (!fieldName || !value) {
            console.error('Filter option missing field or value data attributes');
            return;
        }
        
        // Get current selections for this field
        let currentSelections = this.activeFilters[fieldName] || [];
        currentSelections = [...currentSelections]; // Clone array
        
        if (isChecked) {
            // Add value if not already present
            if (!currentSelections.includes(value)) {
                currentSelections.push(value);
            }
        } else {
            // Remove value
            currentSelections = currentSelections.filter(v => v !== value);
        }
        
        // Update active filters
        if (currentSelections.length === 0) {
            delete this.activeFilters[fieldName];
        } else {
            this.activeFilters[fieldName] = currentSelections;
        }
        
        // Trigger reactivity
        this.activeFilters = { ...this.activeFilters };
        
        // Reset to first page and reload
        this.currentPage = 1;
        this.loadData();
    }
    
    clearFilterSelection(event) {
        event.stopPropagation();
        const fieldName = event.currentTarget.dataset.field;
        
        delete this.activeFilters[fieldName];
        this.activeFilters = { ...this.activeFilters };
        
        this.currentPage = 1;
        this.loadData();
    }
    
    closeFilterDropdowns(event) {
        // Close dropdowns when clicking outside
        if (this.openFilterDropdown) {
            this.openFilterDropdown = null;
        }
    }
    
    handleFilterChange(event) {
        const fieldName = event.target.dataset.field;
        const selectedValue = event.detail.value;
        
        // Update active filters
        if (selectedValue === '') {
            delete this.activeFilters[fieldName];
        } else {
            this.activeFilters[fieldName] = [selectedValue];
        }
        
        // Trigger reactivity
        this.activeFilters = { ...this.activeFilters };
        
        // Reset to first page and reload
        this.currentPage = 1;
        this.loadData();
    }
    
    clearAllFilters() {
        this.activeFilters = {};
        this.openFilterDropdown = null;
        this.currentPage = 1;
        this.loadData();
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Change Owner Modal Handlers
    // ═══════════════════════════════════════════════════════════════════
    
    openChangeOwnerModal() {
        this.showChangeOwnerModal = true;
        this.userSearchTerm = '';
        this.userSearchResults = [];
        this.selectedNewOwner = null;
    }
    
    closeChangeOwnerModal() {
        this.showChangeOwnerModal = false;
        this.userSearchTerm = '';
        this.userSearchResults = [];
        this.selectedNewOwner = null;
        this.isChangingOwner = false;
    }
    
    handleUserSearch(event) {
        const searchValue = event.target.value;
        this.userSearchTerm = searchValue;
        
        // Clear previous timeout
        clearTimeout(this.userSearchTimeout);
        
        if (searchValue.length < 2) {
            this.userSearchResults = [];
            return;
        }
        
        // Debounce search
        this.userSearchTimeout = setTimeout(() => {
            this.searchForUsers(searchValue);
        }, 300);
    }
    
    async searchForUsers(searchTerm) {
        this.isSearchingUsers = true;
        
        try {
            const results = await searchUsers({ searchTerm });
            this.userSearchResults = results.map(user => ({
                Id: user.Id,
                Name: user.Name,
                Email: user.Email,
                SmallPhotoUrl: user.SmallPhotoUrl,
                Title: user.Title || '',
                isSelected: this.selectedNewOwner && this.selectedNewOwner.Id === user.Id,
                userItemClass: (this.selectedNewOwner && this.selectedNewOwner.Id === user.Id) 
                    ? 'user-item user-item-selected' 
                    : 'user-item'
            }));
        } catch (error) {
            console.error('Error searching users:', error);
            this.userSearchResults = [];
        } finally {
            this.isSearchingUsers = false;
        }
    }
    
    handleUserSelect(event) {
        const userId = event.currentTarget.dataset.id;
        const selectedUser = this.userSearchResults.find(u => u.Id === userId);
        
        if (selectedUser) {
            this.selectedNewOwner = selectedUser;
            // Update selection state in results
            this.userSearchResults = this.userSearchResults.map(user => ({
                ...user,
                isSelected: user.Id === userId,
                userItemClass: user.Id === userId ? 'user-item user-item-selected' : 'user-item'
            }));
        }
    }
    
    async handleConfirmOwnerChange() {
        if (!this.selectedNewOwner || this.selectedRecordIds.size === 0) {
            return;
        }
        
        this.isChangingOwner = true;
        
        try {
            const recordIds = Array.from(this.selectedRecordIds);
            const result = await changeRecordsOwner({
                recordIds: recordIds,
                newOwnerId: this.selectedNewOwner.Id
            });
            
            if (result.success) {
                this.showToast(
                    'Success',
                    `Successfully changed owner for ${result.successCount} record(s)`,
                    'success'
                );
                
                // Clear selection and close modal
                this.clearSelection();
                this.closeChangeOwnerModal();
                
                // Reload data
                this.loadData();
            } else {
                this.showToast(
                    'Error',
                    result.errorMessage || 'Failed to change owner',
                    'error'
                );
            }
        } catch (error) {
            this.showToast('Error', this.extractErrorMessage(error), 'error');
        } finally {
            this.isChangingOwner = false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Event Handlers
    // ═══════════════════════════════════════════════════════════════════
    
    handleSearch(event) {
        const searchValue = event.target.value;
        
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchTerm = searchValue;
            this.currentPage = 1; // Reset to first page on new search
            this.loadData();
        }, 300);
    }
    
    clearSearch() {
        this.searchTerm = '';
        this.currentPage = 1;
        this.loadData();
    }
    
    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        
        if (this.sortField === field) {
            // Toggle direction
            this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
        } else {
            this.sortField = field;
            this.sortDirection = 'ASC';
        }
        
        this.currentPage = 1; // Reset to first page on sort change
        this.loadData();
    }
    
    handleRowClick(event) {
        // Don't navigate if clicking on checkbox
        if (event.target.type === 'checkbox') {
            return;
        }
        
        const recordId = event.currentTarget.dataset.id;
        if (recordId) {
            this.navigateToRecord(recordId);
        }
    }
    
    handleLinkClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const recordId = event.currentTarget.dataset.id;
        if (recordId) {
            this.navigateToRecord(recordId);
        }
    }
    
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
            default:
                break;
        }
    }
    
    // Row Actions handlers
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
            default:
                break;
        }
    }
    
    viewRecord(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                actionName: 'view'
            }
        });
    }
    
    editRecord(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                actionName: 'edit'
            }
        });
    }
    
    openChangeOwnerForSingleRecord(recordId) {
        // Set the single record as selected and open modal
        this.selectedRecordIds = new Set([recordId]);
        this.openChangeOwnerModal();
    }
    
    stopPropagation(event) {
        event.stopPropagation();
    }
    
    // Pagination handlers
    handleFirstPage() {
        this.currentPage = 1;
        this.loadData();
    }
    
    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadData();
        }
    }
    
    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadData();
        }
    }
    
    handleLastPage() {
        this.currentPage = this.totalPages;
        this.loadData();
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Helper Methods
    // ═══════════════════════════════════════════════════════════════════
    
    getFieldValue(record, fieldName) {
        if (!record || !fieldName) return '';
        
        // Handle relationship fields (e.g., Account.Name)
        if (fieldName.includes('.')) {
            const parts = fieldName.split('.');
            let value = record;
            for (const part of parts) {
                if (value && typeof value === 'object') {
                    value = value[part];
                } else {
                    return '';
                }
            }
            return value;
        }
        
        return record[fieldName];
    }
    
    formatValue(value, type) {
        if (value === null || value === undefined) return '';
        
        switch (type) {
            case 'BOOLEAN':
                return value ? 'Yes' : 'No';
            case 'DATE':
            case 'DATETIME':
            case 'CURRENCY':
            case 'PERCENT':
                return value; // Let Lightning components handle formatting
            default:
                return String(value);
        }
    }
    
    isLinkField(column, record) {
        // Make Name fields and ID fields clickable
        const metadata = this.fieldMetadata[column.fieldName] || {};
        return metadata.isNameField || column.fieldName === 'Name' || column.fieldName.endsWith('.Name');
    }
    
    getLinkUrl(column, record) {
        const recordId = this.getLinkRecordId(column, record);
        return recordId ? `/${recordId}` : '';
    }
    
    getLinkRecordId(column, record) {
        // For relationship fields, get the related record ID
        if (column.fieldName.includes('.')) {
            const relationshipName = column.fieldName.split('.')[0];
            const relatedRecord = record[relationshipName];
            return relatedRecord ? relatedRecord.Id : '';
        }
        return record.Id;
    }
    
    truncateUrl(url) {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url.length > 30 ? url.substring(0, 30) + '...' : url;
        }
    }
    
    navigateToRecord(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                actionName: 'view'
            }
        });
    }
    
    extractErrorMessage(error) {
        if (typeof error === 'string') return error;
        if (error.body && error.body.message) return error.body.message;
        if (error.message) return error.message;
        return 'An unexpected error occurred.';
    }
    
    exportToCSV() {
        if (!this.records || this.records.length === 0) {
            this.showToast('Warning', 'No records to export', 'warning');
            return;
        }
        
        try {
            // Build CSV header
            const headers = this.columns.map(col => `"${col.label}"`).join(',');
            
            // Build CSV rows
            const rows = this.records.map(record => {
                return this.columns.map(col => {
                    const value = this.getFieldValue(record, col.fieldName);
                    const formattedValue = this.formatValue(value, col.type);
                    // Escape quotes and wrap in quotes
                    return `"${String(formattedValue).replace(/"/g, '""')}"`;
                }).join(',');
            });
            
            const csvContent = [headers, ...rows].join('\n');
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${this.listViewTitle.replace(/\s+/g, '_')}_export.csv`;
            link.click();
            
            this.showToast('Success', 'Export completed', 'success');
        } catch (error) {
            this.showToast('Error', 'Failed to export data', 'error');
        }
    }
    
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}