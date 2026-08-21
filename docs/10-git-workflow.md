# ThreatLens AI - Git Workflow

This guide describes the Git workflow appropriate for the current ThreatLens AI repository. Some practices are recommendations, not repository-enforced policy: no branch protection, CI workflow, release automation, or contribution guide is checked in.

## 1. Repository and Branch Structure

The canonical repository root is `ThreatLens-AI/`. It has:

- Local branch `main`.
- Remote `origin` at `https://github.com/Aryan457-dev/ThreatLens-AI.git`.
- `origin/main` and `origin/HEAD -> origin/main`.
- Local backup branches `backup-before-author-fix`, `backup-local-before-github-merge`, and `backup-remote-main`.
- Remote-tracking branch `origin/backup-remote-main`.

At inspection time, root `main` and `origin/main` pointed to `9d19ec7`, `feat: protect intelligence APIs with JWT authentication`.

The checkout also contains `backend/.git`, a nested Git repository with its own `main`, `origin`, history, and local modifications. Unless explicitly instructed otherwise, run Git commands from the root repository. `git -C backend ...` operates on the nested repository and can show a different status. Do not discard or commit nested-repository changes without determining ownership.

The root `.github/workflows/` contains only `.gitkeep`; no GitHub Actions, branch protection, required checks, release branch, tag policy, or merge automation is present.

## 2. Current Git Status Expectations

Check the root before and after work:

```bash
git status --short --branch
```

A clean checkout has only the branch line. At inspection time, the root worktree showed an untracked `docs/` directory because the numbered documentation was being added. That is intentional for this documentation task, but it should not be included in unrelated commits.

Status codes include:

- ` M path`: modified but unstaged.
- `M  path`: modified and staged.
- `?? path`: untracked.
- `A  path`: new file staged.
- `D  path`: deletion staged.

Never reset, restore, or switch over existing changes until their ownership and importance are clear.

## 3. Recommended Feature Branch Workflow

The repository does not enforce a branch model. Recommended flow:

```text
update main -> create feature branch -> make focused changes
-> run relevant checks -> review diff -> commit -> push
-> open pull request to main -> address review -> merge
```

Keep application, migration, generated, local configuration, and unrelated documentation changes separate.

## 4. Creating a New Branch

With a clean root worktree:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/short-description
```

Recommended, unenforced prefixes are `feature/`, `fix/`, `docs/`, and `chore/`. Use short lowercase names such as `docs/api-reference` or `fix/ioc-validation`. If local changes already exist, commit or stash them only after inspection; do not switch branches blindly.

## 5. Making Changes and Checking Status

```bash
git status --short
git diff --name-only
```

Keep changes in the existing layout: backend code under `backend/app/`, migrations under `backend/alembic/versions/`, frontend code under `frontend/src/app/` or `frontend/components/`, and docs under `docs/`.

Avoid `git add .` until all untracked and modified paths have been inspected. This repository may contain local environment files, generated dependencies, generated Next.js output, and nested Git metadata.

## 6. Reviewing Diffs Before Committing

```bash
git diff
git diff --cached
git diff --name-only
git diff --check
```

Confirm that only intended files are present, no secrets or generated output are staged, API/schema/model/migration changes agree, documentation examples contain placeholders, and database changes include a reviewed Alembic revision.

Untracked files do not appear in `git diff`; stage an intended new file before reviewing its staged diff.

## 7. Staging and Committing

Prefer explicit paths:

```bash
git add backend/app/services/example.py
git add docs/10-git-workflow.md
git status --short
git diff --cached --check
git diff --cached
git commit -m "feat: add example capability"
```

For mixed changes, use `git add -p path/to/file`. `git commit -a` does not stage new files.

## 8. Commit Message Conventions

Recent root history uses short Conventional Commit-style messages such as `feat: implement authentication API`, `feat: add IOC pagination and sorting`, and `feat: protect intelligence APIs with JWT authentication`.

Follow this as a recommendation:

```text
<type>: <imperative description>
```

Useful types are `feat`, `fix`, `docs`, `refactor`, and `chore`:

```bash
git commit -m "docs: add threat intelligence guide"
git commit -m "fix: validate analysis IP input"
```

No commit hook or message validation is configured.

## 9. Pulling and Rebasing Latest Changes

Inspect state before synchronizing:

```bash
git status --short --branch
git fetch origin
git log --oneline --decorate --graph --all -10
```

Update local `main`:

```bash
git switch main
git pull --ff-only origin main
```

Rebase a feature branch:

```bash
git fetch origin
git switch feature/short-description
git rebase origin/main
```

After resolving conflicts, run `git add path/to/resolved-file` and `git rebase --continue`. Stop with `git rebase --abort`. Rebasing rewrites commit IDs; after a pushed rebase use `git push --force-with-lease`, never plain `--force`.

## 10. Pushing Branches

```bash
git branch --show-current
git status --short --branch
git log --oneline origin/main..HEAD
git push --set-upstream origin feature/short-description
```

Later pushes can use `git push`. Do not push feature work directly to `main`; the repository does not technically prevent it, so this is a team recommendation.

## 11. Pull Request Workflow

1. Push a focused branch to `origin`.
2. Open a pull request from it to `main` on GitHub.
3. Describe behavior, files, migration/environment impact, and checks run.
4. Update API or numbered documentation when public behavior changes.
5. Address review feedback with follow-up commits.
6. Rebase on `origin/main` when necessary.
7. Merge after review through the team's approved process.

No PR template, required reviewer configuration, automated status check, or GitHub Actions workflow exists.

## 12. Merge Workflow

No merge method is configured. The recommended default is an approved pull request into `main`.

For an explicitly required local merge:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff feature/short-description
git push origin main
```

There is no release branch or deployment automation to update after a merge.

## 13. Handling Merge Conflicts

```bash
git status
git diff --name-only --diff-filter=U
```

Resolve each `<<<<<<<`, `=======`, and `>>>>>>>` section while preserving intended API, migration, or documentation behavior. Then run relevant checks, stage resolved files, and continue:

```bash
git add path/to/resolved-file
git merge --continue
# or
git rebase --continue
```

Use `git merge --abort` or `git rebase --abort` to cancel. Do not blindly choose one side when resolving important changes.

## 14. Safe Workflow for Documentation-Only Changes

```bash
git switch -c docs/update-guide
git status --short
# edit only the intended file
git diff -- docs/10-git-workflow.md
git diff --check -- docs/10-git-workflow.md
git add docs/10-git-workflow.md
git diff --cached -- docs/10-git-workflow.md
git commit -m "docs: document Git workflow"
git push --set-upstream origin docs/update-guide
```

Stage only the intended documentation file. The current `docs/` directory is untracked, so do not use `git add docs/` unless every file is intended for the same commit.

## 15. Files That Should Not Be Committed

Do not commit `backend/.env`, frontend `.env*` files, Python virtual environments, `__pycache__/`, `*.pyc`, `frontend/node_modules/`, `frontend/.next/`, `frontend/out/`, build output, logs, coverage artifacts, IDE files, `.pem` files, credentials, access tokens, API keys, passwords, JWT secrets, database URLs with credentials, or password hashes.

Do not stage `backend/.git/` as application content. `frontend/package-lock.json` is tracked and should be committed when dependency changes intentionally update it.

## 16. `.gitignore` Guidance

The root `.gitignore` covers Python caches, virtual environments, environment files, IDE files, macOS metadata, logs, coverage, and Python build artifacts. `backend/.gitignore` repeats backend-specific rules. `frontend/.gitignore` covers `node_modules`, Next.js output, build output, environment files, logs, `.pem` files, Vercel output, and TypeScript build information.

Check the rule for a path with:

```bash
git check-ignore -v backend/.env backend/.venv frontend/node_modules frontend/.next frontend/.env.local
```

`docs/` is not ignored and is intended to be versioned.

## 17. Useful Git Commands

```bash
git status --short --branch
git branch --all --verbose --no-abbrev
git remote -v
git log --oneline --decorate --graph -10
git diff --stat
git diff --check
git show --stat --oneline HEAD
git fetch origin
git log --all --oneline -- backend/app/services/threat_correlation_service.py
git blame backend/app/api/router.py
git show <commit>:backend/app/api/router.py
```

Use `git log` and `git blame` to understand route, migration, or scoring history before changing behavior.

## 18. Common Mistakes and Recovery

Unstage a file while keeping its changes:

```bash
git restore --staged path/to/file
```

Discard an unwanted unstaged change only after confirming it is yours:

```bash
git restore path/to/file
```

Undo the last local commit while keeping changes staged:

```bash
git reset --soft HEAD~1
```

If a secret was committed, stop pushing, rotate it, and coordinate history cleanup. Removing the file from the latest commit does not invalidate an exposed credential.

If Git status looks unexpected, compare root and nested repositories:

```bash
git status --short --branch
git -C backend status --short --branch
```

## 19. Developer Checklist Before Pushing

- [ ] Confirm the root repository and current branch.
- [ ] Work from a feature, fix, or docs branch rather than `main`.
- [ ] Preserve and exclude unrelated existing changes.
- [ ] Run relevant frontend lint/build checks, backend manual/API checks, and Alembic checks for database changes.
- [ ] Run `git diff --check`.
- [ ] Review unstaged and staged diffs.
- [ ] Include reviewed migrations for schema changes.
- [ ] Document API or environment changes.
- [ ] Confirm no secrets, environment files, tokens, generated dependencies, or build output are staged.
- [ ] Use a focused commit message.
- [ ] Push the intended branch and open/update its pull request to `main`.

## 20. Current Repository-Specific Git Limitations

- No branch policy, PR template, CI/CD workflow, branch protection, required checks, release automation, or deployment automation is checked in.
- Commit prefixes are observed in history but are not enforced.
- The root `docs/` directory was untracked at inspection time.
- A nested `backend/.git` repository has separate history, branches, remote state, and local modifications.
- No helper script automates status checks, branch creation, pull requests, releases, or validation.
- Ignore rules do not prevent secrets being copied into already tracked files or documentation.
- Git does not verify database migration state, provider credentials, or frontend bearer-token behavior before a push.
