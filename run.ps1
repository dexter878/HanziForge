$ErrorActionPreference = 'Stop'

Write-Host '[HanziForge] Starting app stack...'

function Get-ListeningPids([int]$Port) {
    $netstatLines = netstat -ano -p tcp | Select-String -Pattern ":$Port\s+.*LISTENING"
    if (-not $netstatLines) {
        return @()
    }

    return @(
        $netstatLines |
        ForEach-Object {
            $tokens = ($_ -replace '^\s+', '') -split '\s+'
            if ($tokens.Length -gt 0) { $tokens[-1] }
        } |
        Where-Object { $_ -match '^\d+$' } |
        Sort-Object -Unique
    )
}

function Assert-PortFree([int]$Port, [string]$Name) {
    $conflictPids = Get-ListeningPids -Port $Port
    if ($conflictPids.Count -eq 0) {
        return
    }

    Write-Host "[ERROR] $Name port $Port is already in use." -ForegroundColor Red
    Write-Host 'Conflicting process(es):' -ForegroundColor Red

    foreach ($conflictPid in $conflictPids) {
        $proc = Get-Process -Id $conflictPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host (' - PID {0}: {1}' -f $conflictPid, $proc.ProcessName) -ForegroundColor Red
        }
        else {
            Write-Host (' - PID {0}' -f $conflictPid) -ForegroundColor Red
        }
    }

    Write-Host 'Stop conflicting process(es) and run .\run.ps1 again.' -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host '[ERROR] python was not found in PATH. Install Python 3.9+.' -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host '[ERROR] npm was not found in PATH. Install Node.js 18+.' -ForegroundColor Red
    exit 1
}

Assert-PortFree -Port 5000 -Name 'Backend'
Assert-PortFree -Port 5001 -Name 'Frontend'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir 'backend'
$frontendDir = Join-Path $scriptDir 'frontend'
$dbPath = Join-Path $backendDir 'hanzi.db'

function Test-DatabaseSeeded([string]$BackendPath) {
    Push-Location $BackendPath
    try {
        $countRaw = (python -c "from app.database import SessionLocal, Character, Sentence, HSKTest, Flashcard, Phrase; db=SessionLocal(); total=db.query(Character).count()+db.query(Sentence).count()+db.query(HSKTest).count()+db.query(Flashcard).count()+db.query(Phrase).count(); db.close(); print(total)" 2>$null).Trim()
        $count = 0
        if (-not [int]::TryParse($countRaw, [ref]$count)) {
            return $false
        }
        return ($count -gt 0)
    }
    catch {
        return $false
    }
    finally {
        Pop-Location
    }
}

$needsSeed = (-not (Test-Path $dbPath))
if (-not $needsSeed) {
    $needsSeed = -not (Test-DatabaseSeeded -BackendPath $backendDir)
}

if ($needsSeed) {
    Write-Host '[HanziForge] Database missing or empty. Running seed script...' -ForegroundColor Yellow
    Push-Location $backendDir
    try {
        python scripts/populate_db.py
    }
    finally {
        Pop-Location
    }
}

Write-Host '[HanziForge] Starting backend on port 5000...' -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
} -ArgumentList $backendDir

Start-Sleep -Seconds 2

if ($backendJob.State -eq 'Failed') {
    Write-Host '[ERROR] Backend failed to start. Job output:' -ForegroundColor Red
    Receive-Job $backendJob -Keep
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    exit 1
}

$nodeModulesPath = Join-Path $frontendDir 'node_modules'
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host '[HanziForge] Installing frontend dependencies...' -ForegroundColor Yellow
    Push-Location $frontendDir
    try {
        npm install
    }
    finally {
        Pop-Location
    }
}

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host 'Frontend URL: http://localhost:5001' -ForegroundColor Green
Write-Host 'Backend API : http://localhost:5000/docs' -ForegroundColor Blue
Write-Host 'Press Ctrl+C to stop.' -ForegroundColor Yellow
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

Push-Location $frontendDir
try {
    npm run dev
}
finally {
    Pop-Location
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host '[HanziForge] Stopped.'
}
