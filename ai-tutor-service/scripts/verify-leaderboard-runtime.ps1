param(
    [string]$BaseUrl = 'http://127.0.0.1:18089',
    [Parameter(Mandatory = $true)][string]$Database,
    [string]$ResultsDirectory = "$PSScriptRoot/../build/issue5-task4-runtime"
)
$ErrorActionPreference = 'Stop'
if ($Database -notmatch '^issue5_task4_[A-Za-z0-9_]+$') { throw 'Use an isolated issue5_task4_* database.' }
if (([uri]$BaseUrl).Host -notin @('localhost', '127.0.0.1')) { throw 'Use a local Docker endpoint.' }
function Assert-Ranking($Condition, [string]$Message) { if (!$Condition) { throw $Message } }
function Invoke-Ranking([string]$Path, $Body = $null, [string]$Method = 'GET', $Session = $script:studentSession) {
    $parameters = @{ Uri = "$BaseUrl/api/v1$Path"; Method = $Method; WebSession = $Session }
    if ($null -ne $Body) { $parameters.Body = $Body | ConvertTo-Json -Depth 8; $parameters.ContentType = 'application/json; charset=utf-8' }
    $response = Invoke-RestMethod @parameters
    Assert-Ranking $response.success "Request failed: $Path"
    return $response.data
}
$fixtureUser = [guid]::NewGuid().ToString()
$fixtureStudent = [guid]::NewGuid().ToString()
$fixturePeer = [guid]::NewGuid().ToString()
$fixturePeerStudent = [guid]::NewGuid().ToString()
$fixtureAdmin = [guid]::NewGuid().ToString()
$fixtureUnassigned = [guid]::NewGuid().ToString()
$fixtureOther = [guid]::NewGuid().ToString()
$fixtureOtherStudent = [guid]::NewGuid().ToString()
$fixtureClass = [guid]::NewGuid().ToString()
$fixtureOtherClass = [guid]::NewGuid().ToString()
$fixtureQuiz = [guid]::NewGuid().ToString()
$fixtureQuestion = [guid]::NewGuid().ToString()
$fixtureSql = @"
BEGIN;
INSERT INTO school_classes(id,name,grade_level,academic_year)
VALUES ('$fixtureClass','Task4-$fixtureClass','10','2026-2027'), ('$fixtureOtherClass','Other-$fixtureOtherClass','10','2026-2027');
INSERT INTO users(id,username,email,password_hash,full_name,gender,role)
VALUES ('$fixtureUser','rank-$fixtureUser','$fixtureUser@example.invalid',crypt('Task4Verify1!',gen_salt('bf')),'Ranking smoke','OTHER','STUDENT'),
('$fixturePeer','rank-$fixturePeer','$fixturePeer@example.invalid',crypt('Task4Verify1!',gen_salt('bf')),'Ranking peer','OTHER','STUDENT'),
('$fixtureAdmin','rank-$fixtureAdmin','$fixtureAdmin@example.invalid',crypt('Task4Verify1!',gen_salt('bf')),'Ranking admin','OTHER','ADMIN'),
('$fixtureUnassigned','rank-$fixtureUnassigned','$fixtureUnassigned@example.invalid',crypt('Task4Verify1!',gen_salt('bf')),'Ranking unassigned','OTHER','STUDENT'),
('$fixtureOther','rank-$fixtureOther','$fixtureOther@example.invalid',crypt('Task4Verify1!',gen_salt('bf')),'Other class student','OTHER','STUDENT');
INSERT INTO students(id,user_id,student_code,class_id,grade_level,total_xp)
VALUES ('$fixtureStudent','$fixtureUser','$fixtureStudent','$fixtureClass','10',0),
('$fixturePeerStudent','$fixturePeer','$fixturePeerStudent','$fixtureClass','10',5),
('$fixtureOtherStudent','$fixtureOther','$fixtureOtherStudent','$fixtureOtherClass','10',9999),
(gen_random_uuid(),'$fixtureUnassigned','$fixtureUnassigned',NULL,'10',0);
INSERT INTO xp_transactions(id,student_id,source_type,source_id,amount,balance_after,occurred_at)
VALUES (gen_random_uuid(),'$fixturePeerStudent','LEGACY_QUIZ_ATTEMPT',gen_random_uuid(),5,5,now()-interval '2 days'),
(gen_random_uuid(),'$fixtureOtherStudent','LEGACY_QUIZ_ATTEMPT',gen_random_uuid(),9999,9999,now()-interval '2 days');
INSERT INTO quizzes(id,title,subject,difficulty,time_limit,is_ai_generated,is_active,created_by_id)
VALUES ('$fixtureQuiz','Task 4 ranking runtime quiz','Toán','EASY',15,true,true,'$fixtureUser');
INSERT INTO quiz_questions(id,quiz_id,question_text,question_type,options,correct_option_key,explanation,order_index)
VALUES ('$fixtureQuestion','$fixtureQuiz','2+2?','MULTIPLE_CHOICE','[{"key":"A","content":"4"},{"key":"B","content":"5"}]','A','2+2=4',1);
COMMIT;
"@
$fixtureSql | docker exec -i ai-tutor-postgres psql -U postgres -d $Database -v ON_ERROR_STOP=1 -q
if ($LASTEXITCODE -ne 0) { throw 'Could not create fixture (requires pgcrypto in the isolated DB).' }
$script:studentSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$peerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$unassignedSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$studentAuth = Invoke-Ranking '/auth/login' @{ email = "rank-$fixtureUser"; password = 'Task4Verify1!' } 'POST'
$null = Invoke-Ranking '/auth/login' @{ email = "rank-$fixturePeer"; password = 'Task4Verify1!' } 'POST' $peerSession
$adminAuth = Invoke-Ranking '/auth/login' @{ email = "rank-$fixtureAdmin"; password = 'Task4Verify1!' } 'POST' $adminSession
$unassignedAuth = Invoke-Ranking '/auth/login' @{ email = "rank-$fixtureUnassigned"; password = 'Task4Verify1!' } 'POST' $unassignedSession
$before = Invoke-Ranking '/leaderboard?scope=CLASS&limit=1'
$peerBefore = Invoke-Ranking '/leaderboard?scope=CLASS' $null 'GET' $peerSession
Assert-Ranking ($before.entries.Count -eq 1 -and $before.me.rank -eq 2 -and $peerBefore.me.rank -eq 1) 'Initial scope/ranks are incorrect'
$draft = Invoke-Ranking '/student/quiz-attempts/draft' @{ quizId = $fixtureQuiz; answers = @() } 'POST'
$answers = @(@{ questionId = $fixtureQuestion; value = 'A' })
$first = Invoke-Ranking '/student/quiz-attempts/submit' @{ draftId = $draft.draftId; answers = $answers } 'POST'
Assert-Ranking ($first.xpEarned -eq 10) 'First completion did not award XP'
$after = Invoke-Ranking '/leaderboard?scope=CLASS'
$peerAfter = Invoke-Ranking '/leaderboard?scope=CLASS' $null 'GET' $peerSession
Assert-Ranking ($after.me.rank -eq 1 -and $after.me.totalXp -eq 10 -and $peerAfter.me.rank -eq 2) 'Rank did not refresh for both students after commit'
$retry = Invoke-Ranking '/student/quiz-attempts/submit' @{ draftId = $draft.draftId; answers = @() } 'POST'
Assert-Ranking ($retry.id -eq $first.id) 'Retry produced a new completion'
$foreign = Invoke-Ranking "/leaderboard?scope=CLASS&classId=$fixtureOtherClass&studentId=$fixtureOtherStudent"
Assert-Ranking ($foreign.entries.Count -eq 2 -and $foreign.me.rank -eq 1) 'Foreign parameters changed class scope'
Assert-Ranking (!(($foreign | ConvertTo-Json -Depth 8).Contains('Other class student'))) 'Another class leaked'
$progress = Invoke-Ranking '/students/me/progress'
$profile = Invoke-Ranking '/students/me'
Assert-Ranking ($progress.summary.totalXp -eq 10 -and $profile.totalXp -eq 10 -and $profile.currentStreak -eq 1) 'Progress/profile disagree with awarded XP/streak'
$global = Invoke-Ranking '/leaderboard'
Assert-Ranking ($global.entries.Count -le 20 -and $global.me.totalXp -eq 10) 'Global contract is incorrect'
$databaseState = docker exec ai-tutor-postgres psql -U postgres -d $Database -tAc "SELECT total_xp || ':' || current_streak || ':' || (SELECT SUM(amount) FROM xp_transactions WHERE student_id=s.id) FROM students s WHERE id='$fixtureStudent';"
Assert-Ranking ($LASTEXITCODE -eq 0 -and $databaseState.Trim() -eq '10:1:10') 'Student summary and ledger differ'
New-Item -ItemType Directory -Force $ResultsDirectory | Out-Null
$after | ConvertTo-Json -Depth 10 | Set-Content "$ResultsDirectory/leaderboard.json" -Encoding utf8
# Only disposable test account tokens; keep these in ignored build output.
@{ name = 'Task4 local runtime'; values = @(
    @{ key = 'baseUrl'; value = $BaseUrl; enabled = $true },
    @{ key = 'accessToken'; value = $studentAuth.accessToken; enabled = $true },
    @{ key = 'adminAccessToken'; value = $adminAuth.accessToken; enabled = $true },
    @{ key = 'unassignedAccessToken'; value = $unassignedAuth.accessToken; enabled = $true },
    @{ key = 'otherClassId'; value = $fixtureOtherClass; enabled = $true },
    @{ key = 'otherStudentId'; value = $fixtureOtherStudent; enabled = $true }
) } | ConvertTo-Json -Depth 8 | Set-Content "$ResultsDirectory/postman.environment.json" -Encoding utf8
$evidence = [pscustomobject]@{
    Database = $Database; StudentId = $fixtureStudent; CookieLogin = 'PASS'; Global = 'PASS'; Class = 'PASS';
    MeOutsideTop = 'PASS'; RankBefore = $before.me.rank; RankAfter = $after.me.rank;
    PeerRankBefore = $peerBefore.me.rank; PeerRankAfter = $peerAfter.me.rank;
    CommittedRankRefresh = 'PASS'; Retry = 'PASS'; ClassOwnership = 'PASS'; ProgressProfileLedger = 'PASS'
}
$evidence | ConvertTo-Json | Set-Content "$ResultsDirectory/smoke.json" -Encoding utf8
$evidence
