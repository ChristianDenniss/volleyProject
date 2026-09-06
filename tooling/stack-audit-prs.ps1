# Restack audit PRs: each branch rebases onto the previous, PR bases updated.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

git fetch origin

$layers = @(
  @{ Branch = "fix/dev-vars-example"; Pr = 215; Base = "main" },
  @{ Branch = "fix/login-redirect"; Pr = 216; Base = "fix/dev-vars-example" },
  @{ Branch = "fix/region-header-admin-only"; Pr = 217; Base = "fix/login-redirect" },
  @{ Branch = "fix/trpc-error-leakage"; Pr = 218; Base = "fix/region-header-admin-only" },
  @{ Branch = "fix/banned-user-session"; Pr = 219; Base = "fix/trpc-error-leakage" },
  @{ Branch = "feat/auth-route-middleware"; Pr = 224; Base = "fix/banned-user-session" },
  @{ Branch = "feat/api-rate-limiting"; Pr = 220; Base = "feat/auth-route-middleware" },
  @{ Branch = "feat/security-headers"; Pr = 225; Base = "feat/api-rate-limiting" },
  @{ Branch = "fix/games-batch-revalidation"; Pr = 221; Base = "feat/security-headers" },
  @{ Branch = "perf/games-create-many-batch"; Pr = 222; Base = "fix/games-batch-revalidation" },
  @{ Branch = "fix/players-create-many-conflicts"; Pr = 223; Base = "perf/games-create-many-batch" },
  @{ Branch = "fix/home-numbers-cache-key"; Pr = 226; Base = "fix/players-create-many-conflicts" },
  @{ Branch = "fix/vector-graph-types"; Pr = 228; Base = "fix/home-numbers-cache-key" },
  @{ Branch = "test/sheet-import-worker"; Pr = 229; Base = "fix/vector-graph-types" }
)

foreach ($layer in $layers) {
  $branch = $layer.Branch
  $base = $layer.Base
  $pr = $layer.Pr

  Write-Host "==> $branch onto origin/$base (PR #$pr)"
  git checkout -B "stack-work-$branch" "origin/$branch"
  git rebase "origin/$base"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Rebase failed for $branch - resolve conflicts and re-run from this layer."
  }
  git push --force-with-lease "origin" "stack-work-${branch}:refs/heads/$branch"
  gh pr edit $pr --base $base
}

git branch -f audit-stack "origin/test/sheet-import-worker"
git push --force-with-lease origin audit-stack
Write-Host "Stack tip: audit-stack -> origin/test/sheet-import-worker"
