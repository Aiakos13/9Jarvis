$wshell = New-Object -ComObject WScript.Shell
if (-not $wshell.AppActivate(20824)) {
    throw "Activation failed"
}
Start-Sleep -Milliseconds 500
Set-Clipboard -Value "NODE-PASTE-TEST"
$wshell.SendKeys("^v")
