$zipPath = 'D:\FyndHack\submission_evidence\Fynd_Checkout_Project.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath }
$tempDir = 'D:\FyndHack\temp_submission'
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Copy-Item 'D:\FyndHack\README.md' $tempDir
Copy-Item 'D:\FyndHack\TEST_PLAN.md' $tempDir
Copy-Item 'D:\FyndHack\run.bat' $tempDir
Copy-Item 'D:\FyndHack\run-tests.bat' $tempDir
Copy-Item 'D:\FyndHack\.gitignore' $tempDir

Copy-Item 'D:\FyndHack\backend' $tempDir -Recurse
if (Test-Path "$tempDir\backend\target") { Remove-Item "$tempDir\backend\target" -Recurse -Force }

Copy-Item 'D:\FyndHack\frontend' $tempDir -Recurse
if (Test-Path "$tempDir\frontend\node_modules") { Remove-Item "$tempDir\frontend\node_modules" -Recurse -Force }
if (Test-Path "$tempDir\frontend\dist") { Remove-Item "$tempDir\frontend\dist" -Recurse -Force }
if (Test-Path "$tempDir\frontend\playwright-report") { Remove-Item "$tempDir\frontend\playwright-report" -Recurse -Force }
if (Test-Path "$tempDir\frontend\test-results") { Remove-Item "$tempDir\frontend\test-results" -Recurse -Force }

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -CompressionLevel Optimal
Remove-Item $tempDir -Recurse -Force
Get-Item $zipPath | Select-Object Name, Length
