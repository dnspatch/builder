// Package web holds the static front end of the configurator.
package web

import "embed"

// Files is the front end, served as is: no bundler, no build step.
//
//go:embed index.html
var Files embed.FS
