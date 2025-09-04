#!/bin/bash

METADATA_DIR="$(dirname "$0")/metadata"
SHARED_METADATA_FILE="$METADATA_DIR/videos.json"

# Pravimo zajednicki metadata fajl ako ne postoji
if [ ! -f "$SHARED_METADATA_FILE" ]; then
  echo '[]' > "$SHARED_METADATA_FILE"
fi

# Brojimo postojece videe zbog indeksa
INDEX=$(grep -c '"title"' "$SHARED_METADATA_FILE")

echo "Lokalni video (1) ili YouTube video (2)?"
read VIDEO_TYPE

if [ "$VIDEO_TYPE" = "1" ]; then
  echo "Ime lokalnog videa (primer video.mp4):"
  read INPUT_MP4
  OUTPUT_DIR="$(dirname "$0")/hls-output/$INDEX"
  mkdir -p "$OUTPUT_DIR"
  mkdir -p "$METADATA_DIR"

  # Brisanje prethodnih .ts i .m3u8 fajlova ukoliko postoje
  rm -f "$OUTPUT_DIR"/*.ts "$OUTPUT_DIR"/*.m3u8

  ffmpeg -y -i "$INPUT_MP4" \
    -c:v libx264 -c:a aac \
    -preset veryfast \
    -hls_time 4 \
    -hls_list_size 0 \
    -start_number 0 \
    -f hls "$OUTPUT_DIR/playlist.m3u8"

  if ls "$OUTPUT_DIR"/*.ts 1> /dev/null 2>&1; then
    echo "Stream kreiran u $OUTPUT_DIR"
  else
    echo "ERROR: Stream nije kreiran. Doslo je do greske."
    exit 1
  fi

  STREAMING_URL="${STREAMING_BASE_URL}/hls/$INDEX/playlist.m3u8"
  YOUTUBE_URL=""
elif [ "$VIDEO_TYPE" = "2" ]; then
  echo "Unesite YouTube link:"
  read YOUTUBE_URL
  STREAMING_URL="$YOUTUBE_URL"
  INPUT_MP4=""  # No local file
else
  echo "Nevalidan izbor."
  exit 1
fi

METADATA_FILE="$METADATA_DIR/$INDEX.json"

echo "Naziv videa:"
read VIDEO_TITLE
echo "Mesto snimanja:"
read VIDEO_LOCATION
echo "Datum snimanja (npr. 2025-07-16T14:00:00Z):"
read VIDEO_DATE
echo "Ko je na snimku:"
read VIDEO_SUBJECT
echo "Dodatne beleške (opciono):"
read NOTES

if [ -n "$YOUTUBE_URL" ]; then
  cat > "$METADATA_FILE" <<EOL
{
  "video_title": "$VIDEO_TITLE",
  "video_location": "$VIDEO_LOCATION",
  "video_date": "$VIDEO_DATE",
  "video_subject": "$VIDEO_SUBJECT",
  "notes": "$NOTES",
  "youtube_url": "$YOUTUBE_URL"
}
EOL
else
  cat > "$METADATA_FILE" <<EOL
{
  "video_title": "$VIDEO_TITLE",
  "video_location": "$VIDEO_LOCATION",
  "video_date": "$VIDEO_DATE",
  "video_subject": "$VIDEO_SUBJECT",
  "notes": "$NOTES"
}
EOL
fi

echo "Metadata sacuvan u $METADATA_FILE"

# Citamo sadrzaj zajednickog metadata fajla
content=$(cat "$SHARED_METADATA_FILE")

# Na sadrzaj dodajemo dodatne JSON informacije o novom videu
if [ "$content" = "[]" ]; then
  echo "[{\"title\":\"$VIDEO_TITLE\",\"index\":$INDEX,\"streaming_url\":\"$STREAMING_URL\"}]" > "$SHARED_METADATA_FILE"
else
  new_content="${content%]} ,{\"title\":\"$VIDEO_TITLE\",\"index\":$INDEX,\"streaming_url\":\"$STREAMING_URL\"}]"
  echo "$new_content" > "$SHARED_METADATA_FILE"
fi

echo "Zavrseno"