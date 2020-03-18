.DEFAULT_GOAL = run
.PHONY: run

SHELL = /usr/bin/env bash

run:
	docker-compose up --build; exit=$$?; docker-compose down; exit $$exit
