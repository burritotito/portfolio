#!/bin/bash
# Creates a folder under public/work/ for every slug listed below.
# Add or remove a line any time you add/remove a project, then rerun: bash create-folders.sh
# Safe to rerun — existing folders (and any images already in them) are left untouched.

projects=(
  champion-x-undercover
  starbucks
  uniqlo
  mukcyen
  gabriel-grad
  tekkons
  bella-poarch
  grollz
  one-or-eight-mv-shoot
  12-buckle
  ziva
  one-or-eight-x-kamiya
  zeeger-website
  slawn-x-yachty
  paranoia
  sophie-book
  wingstop
  euro
  kaytranada
  team-rocket
  silk-road-music-video
  project-crown
  mark-gong-alex-consani
  vogue-china-alex-consani
  ann-mukcyen-styling
  marshall-x-gliiico
)

for p in "${projects[@]}"; do
  mkdir -p "public/work/$p"
done

echo "Done — created/verified ${#projects[@]} project folders."