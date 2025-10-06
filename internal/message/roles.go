package message

type ROLE string 

const (
	SYSTEM_MESSAGE ROLE = "system"
	USER_MESSAGE   ROLE = "user"
	DEVELOPER_MESSAGE ROLE = "developer"
)

func (r ROLE) String() string {
	return string(r)
}

