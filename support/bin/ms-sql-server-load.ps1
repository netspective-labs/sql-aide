# Load a SQL file into a CLI-provided SQL*Server server and database.
# IMPORTANT: this should be a "twin" of pattern/typical/typical-cli:powershellDriver();
#            if you change the code here, reflect it there. The only difference
#            is that this script accepts SQL as a separate file but typical-cli:powershellDriver()
#            embeds the SQL making it suitable for piping.

param (
    [Parameter(Mandatory=$true)]
    [string]$ServerName,

    [Parameter(Mandatory=$true)]
    [string]$DatabaseName,

    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$connectionString = "Server=$ServerName;Database=$DatabaseName;Integrated Security=True;"
$query = Get-Content $FilePath | Out-String

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()

    $command = $connection.CreateCommand()
    $command.CommandText = $query
    $command.ExecuteNonQuery()

    Write-Host "SQL file loaded successfully."
}
catch {
    Write-Host "Error loading SQL file: $_"
}
finally {
    $connection.Close()
}
