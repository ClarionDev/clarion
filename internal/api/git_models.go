package api

import "time"

type GitCommit struct {
	Hash    string    `json:"hash"`
	Message string    `json:"message"`
	Author  string    `json:"author"`
	Date    time.Time `json:"date"`
}

type FileDiff struct {
	Path  string `json:"path"`
	Patch string `json:"patch"`
}

type GetGitLogRequest struct {
	Path string `json:"path"`
}

type GetGitLogResponse struct {
	Commits []*GitCommit `json:"commits"`
}

type GetCommitDiffRequest struct {
	Path string `json:"path"`
	Hash string `json:"hash"`
}

type GetCommitDiffResponse struct {
	Diff string `json:"diff"`
}

type CheckoutCommitRequest struct {
	Path string `json:"path"`
	Hash string `json:"hash"`
}
