package agent


type AgentProfile struct {
	ID 		    string
	Name		string
	Description	string
	Version		string
	Author		string
    Icon        string // New: For frontend icon mapping
}