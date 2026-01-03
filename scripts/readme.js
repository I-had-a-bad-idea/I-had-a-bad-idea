// - name: Add timestamp to SVG
//               run: |
//                 TIMESTAMP=$(date +%s)
//                 # Replace existing Markdown reference with timestamp query
//                 sed -i "s|!\[Top Languages\](assets/top-langs.svg.*)|![Top Languages](assets/top-langs.svg?ts=$TIMESTAMP)|g" README.md