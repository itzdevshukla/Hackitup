$f = 'c:\Users\Dev Shukla\Desktop\Hack!tUp\GlitchMafia\GLITCHMAFIA_UI\src\components\ClassicLeaderboard.jsx'
$lines = Get-Content $f
$cleaned = $lines[0..302] + $lines[480..722]
$cleaned | Set-Content $f
