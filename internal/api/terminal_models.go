package api

// WsInitMessage is the initial message from the client to start a command.
type WsInitMessage struct {
	Command     string `json:"command"`
	ProjectRoot string `json:"project_root"`
}

// WsResponseMessage is the message sent from the server to the client.
type WsResponseMessage struct {
	Type string `json:"type"` // "stdout", "stderr", "exit"
	Data string `json:"data"`
}
