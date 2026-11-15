param(
    [int]$Port = 8000,
    [switch]$Reload
)

$python = Join-Path $PSScriptRoot "..\.venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    throw "Backend virtual environment was not found. Create it first with: py -m venv .venv"
}

$args = @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "$Port")
if ($Reload) { $args += "--reload" }

& $python @args
