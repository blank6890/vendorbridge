"""
CSV export utility.
Generates CSV strings from list-of-dict data.
"""

import csv
import io


def generate_csv(data, fields):
    """Generate a CSV string from a list of dictionaries.

    Args:
        data: List of dictionaries containing the data rows.
        fields: List of field names to include as columns.

    Returns:
        str: CSV formatted string with headers.
    """
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()

    for row in data:
        # Convert any non-string values to strings for safety
        clean_row = {}
        for field in fields:
            value = row.get(field, "")
            if isinstance(value, list):
                value = str(value)
            elif hasattr(value, "isoformat"):
                value = value.isoformat()
            clean_row[field] = value
        writer.writerow(clean_row)

    csv_string = output.getvalue()
    output.close()
    return csv_string
