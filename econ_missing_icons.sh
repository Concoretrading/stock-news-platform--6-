#!/bin/bash

# List of missing economic event icons (from your browser console)
missing_icons=(
  retail-sales.png
  beige-book.png
  housing-starts.png
  capacity-utilization.png
  ppi.png
  empire-state.png
  jobless-claims.png
  building-permits.png
  import-prices.png
  core-ppi.png
  industrial-production.png
  inventories.png
  philly-fed.png
  fed-speech.png
  retail-sales-ex-autos.png
  consumer-sentiment.png
  core-cpi.png
)

default_icon="public/images/econ/default.png"
icon_dir="public/images/econ"

for icon in "${missing_icons[@]}"; do
  target="$icon_dir/$icon"
  if [ ! -f "$target" ]; then
    cp "$default_icon" "$target"
    echo "Created placeholder: $target"
  else
    echo "Already exists: $target"
  fi
done
