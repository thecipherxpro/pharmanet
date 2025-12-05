# Integrating with Public Shift Details Page

To allow external applications to link directly to a public shift details page in Pharmanet, use the following URL structure:

### URL Format

```
https://shifts.pharmanet.ca/PublicShift?id=<shift_id>
```

*(Replace `https://shifts.pharmanet.ca` with your actual application domain)*

### Parameters

- **`id` (Required)**: This is the unique identifier (string) of the Shift entity you wish to display.

### Expected Content

When an external application navigates to this URL, the page will:

1.  **Retrieve the Shift entity** using the provided `id`.
2.  **Display comprehensive details** about the shift including:
    - Pharmacy Name & Location
    - Hourly Rate & Total Pay
    - Shift Description
    - Included Services (e.g., Assistant on-site)
3.  **Present all scheduled dates and times** associated with that shift (from the `shift.schedule` array). Each entry (date, start time, end time) is formatted for clear viewing.
4.  **Handle Errors**: If the `shift_id` is invalid or the shift is not found, an appropriate "Shift Not Found" message is displayed.

### Example URL

```
https://shifts.pharmanet.ca/PublicShift?id=6924f013a2f99c85a06e831c
``