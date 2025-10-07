package tokencounter

import (
	"context"
	"fmt"

	"github.com/pkoukk/tiktoken-go"
)

var _ CounterProvider = (*TiktokenCounter)(nil)

type TiktokenCounter struct{}

func NewTiktokenCounter() *TiktokenCounter {
	return &TiktokenCounter{}
}

func (t *TiktokenCounter) Count(_ context.Context, modelName string, content string) (int, error) {
	if modelName == "" {
		modelName = "gpt-4o"
	}

	tke, err := tiktoken.EncodingForModel(modelName)
	if err != nil {
		tke, err = tiktoken.GetEncoding("cl100k_base")
		if err != nil {
			return 0, fmt.Errorf("could not find encoding for model %s and common fallback failed: %w", modelName, err)
		}
	}

	tokens := tke.Encode(content, nil, nil)

	return len(tokens), nil
}
