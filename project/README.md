# Academic Calculator

A JavaFX desktop app for calculating GPA, SGPA, and CGPA.

## Requirements

- JDK 25 or newer (Java 25 LTS)
- Maven 3.8 or newer

## Run

From the project directory:

```bash
mvn javafx:run
```

The JavaFX Maven plugin downloads the platform-specific JavaFX runtime as needed.

## Calculation

- **GPA / SGPA:** `sum(credits × grade points) / sum(credits)`
- **CGPA:** `sum(semester credits × semester SGPA) / sum(semester credits)`

Enter grade points using your institution's grading scale. GPA and SGPA are calculated from course rows; CGPA is calculated from semester SGPA and total semester credits.
