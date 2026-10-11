param(
    [string]$BaseUrl = 'http://127.0.0.1:3000/api/v1',
    [string]$Database = 'quiz_validation_20261008'
)
$ErrorActionPreference = 'Stop'
if ($Database -notmatch '^quiz_validation_[A-Za-z0-9_]+$') { throw 'Use an isolated quiz_validation_* database.' }
function Assert-Quiz($Condition, [string]$Message) { if (!$Condition) { throw $Message } }
function Invoke-Quiz([string]$Path, $Body = $null, [string]$Method = 'GET') {
    $parameters = @{ Uri = "$BaseUrl$Path"; Method = $Method; Headers = $script:quizHeaders }
    if ($null -ne $Body) { $parameters.Body = $Body | ConvertTo-Json -Depth 8; $parameters.ContentType = 'application/json; charset=utf-8' }
    $response = Invoke-RestMethod @parameters
    Assert-Quiz $response.success "API failed: $Path"
    return $response.data
}
function Invoke-QuizSql([string]$Sql) {
    $result = $Sql | docker exec -i ai-tutor-postgres psql -v ON_ERROR_STOP=1 -U postgres -d $Database -At
    if ($LASTEXITCODE -ne 0) { throw 'Fixture SQL failed' }
    return $result
}

# Only the fake account created by scripts/quiz-e2e-fixture.sql is used here.
$script:quizHeaders = @{}
$login = Invoke-Quiz '/auth/login' @{ email = 'quiz-e2e'; password = 'Admin@123' } 'POST'
$script:quizHeaders = @{ Authorization = "Bearer $($login.accessToken)" }
$quizId = 'a6000000-0000-0000-0000-000000000003'
$content = Invoke-Quiz "/student/quizzes/$quizId"
Assert-Quiz ($content.questions.Count -eq 4) 'Expected four question types'
Assert-Quiz (($content | ConvertTo-Json -Depth 8) -notmatch 'correctOptionKey|explanation') 'Answer key leaked before submission'
$draft = Invoke-Quiz '/student/quiz-attempts/draft' @{ quizId = $quizId; answers = @() } 'POST'
$answers = @(
    @{ questionId = 'a6000000-0000-0000-0000-000000000011'; value = 'A' },
    @{ questionId = 'a6000000-0000-0000-0000-000000000012'; value = 'A' },
    @{ questionId = 'a6000000-0000-0000-0000-000000000013'; value = '  HÀ   NỘI ' },
    @{ questionId = 'a6000000-0000-0000-0000-000000000014'; value = 'Phép cộng' }
)
$saved = Invoke-Quiz '/student/quiz-attempts/draft' @{ quizId = $quizId; draftId = $draft.draftId; answers = $answers } 'POST'
Assert-Quiz ($saved.answeredCount -eq 4) 'Autosave lost answers'
$result = Invoke-Quiz '/student/quiz-attempts/submit' @{ draftId = $draft.draftId; answers = $answers; score = 99; xpEarned = 999 } 'POST'
Assert-Quiz ($result.score -eq 10 -and $result.xpEarned -eq 0) 'Retake grading/XP is incorrect'
$replayed = Invoke-Quiz '/student/quiz-attempts/submit' @{ draftId = $draft.draftId; answers = @() } 'POST'
Assert-Quiz ($replayed.id -eq $result.id) 'Duplicate submit created another result'
$null = Invoke-Quiz "/student/quiz-attempts/$($result.id)/hide" $null 'PATCH'
$history = @(Invoke-Quiz '/student/quiz-attempts/history')
Assert-Quiz (($history | Where-Object id -eq $result.id).Count -eq 0) 'Hidden attempt still appears in history'
$stored = Invoke-Quiz "/student/quiz-attempts/$($result.id)"
Assert-Quiz ($stored.score -eq 10) 'Hiding altered the result'

# Create a new one-question quiz for the scheduler fallback. No browser submits this draft.
$fallbackQuiz = [guid]::NewGuid().ToString()
$fallbackQuestion = [guid]::NewGuid().ToString()
$null = Invoke-QuizSql "INSERT INTO quizzes(id,title,subject,difficulty,time_limit,is_ai_generated,created_by_id) VALUES ('$fallbackQuiz','Scheduler fallback verification','Toán','MEDIUM',1,true,'a6000000-0000-0000-0000-000000000001'); INSERT INTO quiz_questions(id,quiz_id,question_text,type,options,correct_option_key,explanation,order_index) SELECT '$fallbackQuestion','$fallbackQuiz',question_text,type,options,correct_option_key,explanation,1 FROM quiz_questions WHERE id='a6000000-0000-0000-0000-000000000015';"
$fallbackDraft = Invoke-Quiz '/student/quiz-attempts/draft' @{ quizId = $fallbackQuiz; answers = @(@{ questionId = $fallbackQuestion; value = 'A' }) } 'POST'
$null = Invoke-QuizSql "UPDATE quiz_attempt_drafts SET started_at=now()-interval '61 seconds', expires_at=now()-interval '1 second' WHERE id='$($fallbackDraft.draftId)';"
for ($poll = 0; $poll -lt 15; $poll++) {
    $state = Invoke-Quiz "/student/quiz-attempts/draft/$($fallbackDraft.draftId)"
    if ($state.attemptId) { break }
    Start-Sleep -Seconds 2
}
Assert-Quiz ($null -ne $state.attemptId) 'Scheduled auto-submit did not run'
$fallbackResult = Invoke-Quiz "/student/quiz-attempts/$($state.attemptId)"
Assert-Quiz ($fallbackResult.score -eq 10 -and $fallbackResult.xpEarned -eq 10 -and $fallbackResult.durationSeconds -eq 60) 'Scheduled grading is incorrect'
$count = Invoke-QuizSql "SELECT count(*) FROM quiz_attempts WHERE source_draft_id='$($fallbackDraft.draftId)';"
Assert-Quiz ([int]$count -eq 1) 'Scheduler produced duplicate attempts'
[pscustomobject]@{ Api='PASS'; FourTypes='PASS'; Autosave='PASS'; RetakeXp='PASS'; Idempotency='PASS'; Hide='PASS'; ScheduledFallback='PASS' }
