param(
    [string]$BaseUrl = 'http://127.0.0.1:18088',
    [Parameter(Mandatory = $true)][string]$Database,
    [string]$ResultsDirectory = "$PSScriptRoot/../build/issue5-task23-runtime"
)
$ErrorActionPreference = 'Stop'
# Fixture writes are intentionally restricted to disposable Task 2/3 databases.
if ($Database -notmatch '^issue5_task23_[A-Za-z0-9_]+$') { throw 'Use an isolated issue5_task23_* database.' }
if (([uri]$BaseUrl).Host -notin @('localhost', '127.0.0.1')) { throw 'Use a local Docker endpoint.' }
function Assert-Progress($Condition, [string]$Message) { if (!$Condition) { throw $Message } }
function Invoke-Progress([string]$Path, $Body = $null, [string]$Method = 'GET', $Session = $script:studentSession) {
    $parameters = @{ Uri = "$BaseUrl/api/v1$Path"; Method = $Method; WebSession = $Session }
    if ($null -ne $Body) { $parameters.Body = $Body | ConvertTo-Json -Depth 8; $parameters.ContentType = 'application/json; charset=utf-8' }
    $response = Invoke-RestMethod @parameters
    Assert-Progress $response.success "Request failed: $Path"
    return $response.data
}
$fixtureUser = [guid]::NewGuid().ToString()
$fixtureStudent = [guid]::NewGuid().ToString()
$fixtureAdmin = [guid]::NewGuid().ToString()
$fixtureQuiz = [guid]::NewGuid().ToString()
$fixtureQuestion = [guid]::NewGuid().ToString()
$fixtureName = "task23-$fixtureUser"
$fixtureAdminName = "task23-$fixtureAdmin"
$fixtureSql = @"
BEGIN;
INSERT INTO users(id,username,email,password_hash,full_name,gender,role)
VALUES ('$fixtureUser','$fixtureName','$fixtureName@example.invalid',crypt('Task23Verify1!',gen_salt('bf')),'Progress smoke','OTHER','STUDENT'),
('$fixtureAdmin','$fixtureAdminName','$fixtureAdminName@example.invalid',crypt('Task23Verify1!',gen_salt('bf')),'Admin smoke','OTHER','ADMIN');
INSERT INTO students(id,user_id,student_code,grade_level) VALUES ('$fixtureStudent','$fixtureUser','$fixtureStudent','10');
INSERT INTO quizzes(id,title,subject,difficulty,time_limit,is_ai_generated,is_active,created_by_id)
VALUES ('$fixtureQuiz','Task 2/3 runtime quiz','Toán','EASY',15,true,true,'$fixtureUser');
INSERT INTO quiz_questions(id,quiz_id,question_text,question_type,options,correct_option_key,explanation,order_index)
VALUES ('$fixtureQuestion','$fixtureQuiz','2+2?','MULTIPLE_CHOICE','[{"key":"A","content":"4"},{"key":"B","content":"5"}]','A','2+2=4',1);
COMMIT;
"@
$fixtureSql | docker exec -i ai-tutor-postgres psql -U postgres -d $Database -v ON_ERROR_STOP=1 -q
if ($LASTEXITCODE -ne 0) { throw 'Could not create runtime fixture (requires pgcrypto in the isolated DB).' }
$script:studentSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$studentAuth = Invoke-Progress '/auth/login' @{ email = $fixtureName; password = 'Task23Verify1!' } 'POST'
$adminAuth = Invoke-Progress '/auth/login' @{ email = $fixtureAdminName; password = 'Task23Verify1!' } 'POST' $adminSession
$empty = Invoke-Progress '/students/me/progress'
Assert-Progress ($empty.summary.totalXp -eq 0 -and $empty.dailyActivity.Count -eq 7) 'Empty progress is incorrect'
$draft = Invoke-Progress '/student/quiz-attempts/draft' @{ quizId = $fixtureQuiz; answers = @() } 'POST'
$answers = @(@{ questionId = $fixtureQuestion; value = 'A' })
$first = Invoke-Progress '/student/quiz-attempts/submit' @{ draftId = $draft.draftId; answers = $answers } 'POST'
$retry = Invoke-Progress '/student/quiz-attempts/submit' @{ draftId = $draft.draftId; answers = @() } 'POST'
Assert-Progress ($first.xpEarned -eq 10 -and $retry.id -eq $first.id) 'Award or retry is incorrect'
$retakeDraft = Invoke-Progress '/student/quiz-attempts/draft' @{ quizId = $fixtureQuiz; answers = @() } 'POST'
$retake = Invoke-Progress '/student/quiz-attempts/submit' @{ draftId = $retakeDraft.draftId; answers = $answers } 'POST'
Assert-Progress ($retake.xpEarned -eq 0 -and $retake.xpAwardStatus -eq 'ALREADY_REWARDED') 'Retake incorrectly received XP'
$progress = Invoke-Progress '/students/me/progress'
$profile = Invoke-Progress '/students/me'
$adminView = Invoke-Progress "/admin/students/$fixtureStudent" $null 'GET' $adminSession
Assert-Progress ($progress.summary.totalXp -eq 10 -and $progress.summary.currentStreak -eq 1) 'Progress summary is incorrect'
Assert-Progress ($profile.currentStreak -eq 1 -and $adminView.currentStreak -eq 1) 'Streak differs across views'
Assert-Progress ($progress.dailyActivity[-1].quizCount -eq 2 -and $progress.dailyActivity[-1].xpEarned -eq 10) 'Daily aggregates are incorrect'
Assert-Progress ($progress.subjectStats[0].attemptCount -eq 2 -and $progress.subjectStats[0].xpEarned -eq 10) 'Subject XP was multiplied'
Assert-Progress ($progress.recentQuizzes.Count -eq 2) 'Recent quiz count is incorrect'
$databaseState = docker exec ai-tutor-postgres psql -U postgres -d $Database -tAc "SELECT total_xp || ':' || current_streak || ':' || (SELECT SUM(amount) FROM xp_transactions WHERE student_id=s.id) FROM students s WHERE id='$fixtureStudent';"
Assert-Progress ($LASTEXITCODE -eq 0 -and $databaseState.Trim() -eq '10:1:10') 'Student and ledger do not reconcile'
$schema = Invoke-RestMethod "$BaseUrl/v3/api-docs"
Assert-Progress ($null -ne $schema.paths.'/api/v1/students/me/progress'.get) 'Progress missing from OpenAPI'
New-Item -ItemType Directory -Force $ResultsDirectory | Out-Null
$progress | ConvertTo-Json -Depth 12 | Set-Content "$ResultsDirectory/progress.json" -Encoding utf8
# Test account tokens stay in ignored build output, never in tracked source or console.
@{ name = 'Task23 local runtime'; values = @(
    @{ key = 'baseUrl'; value = $BaseUrl; enabled = $true },
    @{ key = 'accessToken'; value = $studentAuth.accessToken; enabled = $true },
    @{ key = 'adminAccessToken'; value = $adminAuth.accessToken; enabled = $true }
) } | ConvertTo-Json -Depth 8 | Set-Content "$ResultsDirectory/postman.environment.json" -Encoding utf8
$evidence = [pscustomobject]@{
    Database = $Database; StudentId = $fixtureStudent; CookieLogin = 'PASS'; Submit = 'PASS';
    Retry = 'PASS'; Retake = 'PASS'; Progress = 'PASS'; ProfileAdminStreak = 'PASS';
    LedgerReconciliation = 'PASS'; OpenAPI = 'PASS'
}
$evidence | ConvertTo-Json | Set-Content "$ResultsDirectory/smoke.json" -Encoding utf8
$evidence
