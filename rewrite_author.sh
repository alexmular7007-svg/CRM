#!/bin/bash
export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch --env-filter '
if [ "$GIT_COMMITTER_NAME" = "Arjun Singh" ]
then
    export GIT_COMMITTER_NAME="TaskFlow AI"
    export GIT_COMMITTER_EMAIL="dev@taskflow.ai"
fi
if [ "$GIT_AUTHOR_NAME" = "Arjun Singh" ]
then
    export GIT_AUTHOR_NAME="TaskFlow AI"
    export GIT_AUTHOR_EMAIL="dev@taskflow.ai"
fi
' -- --all
