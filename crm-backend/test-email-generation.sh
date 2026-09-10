#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  POST /api/emails/generate - End-to-End Test                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
BASE_URL="http://localhost:8081"
ENDPOINT="/api/emails/generate"
TONES_ENDPOINT="/api/emails/tones"

echo "📋 Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Endpoint: $ENDPOINT"
echo ""

# Health check
echo "1️⃣  Checking server health..."
if ! curl -s "$BASE_URL/api/emails/health" > /dev/null 2>&1; then
  echo "❌ Server is not running. Start with: mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'"
  exit 1
fi
echo "✓ Server is running"
echo ""

# Get tones
echo "2️⃣  Fetching available tones..."
TONES_RESPONSE=$(curl -s -X GET "$BASE_URL$TONES_ENDPOINT" \
  -H "Content-Type: application/json")

if echo "$TONES_RESPONSE" | grep -q "Professional"; then
  echo "✓ Tones endpoint working"
  echo "  Available tones:"
  echo "$TONES_RESPONSE" | jq '.data[]' 2>/dev/null | head -5 || echo "  (Could not parse)"
else
  echo "❌ Tones endpoint failed"
  echo "$TONES_RESPONSE"
fi
echo ""

# Send email generation request
echo "3️⃣  Sending email generation request..."
REQUEST_PAYLOAD='{
  "purpose": "Product launch announcement",
  "targetAudience": "Enterprise customers",
  "productService": "AI-powered email marketing platform",
  "tone": "Professional",
  "offer": "Limited time: 50% off first 3 months",
  "keyPoints": "Fast deployment, Enterprise security, 24/7 support",
  "ctaText": "Start Free Trial",
  "ctaUrl": "https://example.com/trial",
  "language": "English",
  "companyName": "TechCorp"
}'

echo "  Payload:"
echo "$REQUEST_PAYLOAD" | jq '.' 2>/dev/null || echo "$REQUEST_PAYLOAD"
echo ""

# POST request
RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD")

echo "4️⃣  Response received:"
echo ""

# Parse and validate response
if echo "$RESPONSE" | jq . > /dev/null 2>&1; then
  echo "✓ Valid JSON response"
  
  # Extract fields
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  DATA_SUCCESS=$(echo "$RESPONSE" | jq -r '.data.success')
  SUBJECT=$(echo "$RESPONSE" | jq -r '.data.subject // "NULL"')
  BODY_PLAIN=$(echo "$RESPONSE" | jq -r '.data.bodyPlainText // "NULL"')
  BODY_HTML=$(echo "$RESPONSE" | jq -r '.data.bodyHtml // "NULL"')
  CTA_TEXT=$(echo "$RESPONSE" | jq -r '.data.ctaText // "NULL"')
  CTA_URL=$(echo "$RESPONSE" | jq -r '.data.ctaUrl // "NULL"')
  MODEL=$(echo "$RESPONSE" | jq -r '.data.model // "NULL"')
  ERROR=$(echo "$RESPONSE" | jq -r '.data.error // "NO ERROR"')
  
  echo "Response Structure:"
  echo "  success (wrapper): $SUCCESS"
  echo "  success (data): $DATA_SUCCESS"
  echo ""
  
  echo "5️⃣  Subject Validation:"
  if [ "$SUBJECT" != "NULL" ] && [ ! -z "$SUBJECT" ]; then
    echo "  ✓ Subject present: \"$SUBJECT\" (${#SUBJECT} chars)"
  else
    echo "  ❌ Subject missing or empty"
  fi
  echo ""
  
  echo "6️⃣  Plain Text Body Validation:"
  if [ "$BODY_PLAIN" != "NULL" ] && [ ! -z "$BODY_PLAIN" ]; then
    BODY_LEN=${#BODY_PLAIN}
    echo "  ✓ Body plain text present ($BODY_LEN chars)"
    echo "  Preview: ${BODY_PLAIN:0:80}..."
  else
    echo "  ❌ Body plain text missing"
  fi
  echo ""
  
  echo "7️⃣  HTML Body Validation:"
  if [ "$BODY_HTML" != "NULL" ] && [ ! -z "$BODY_HTML" ]; then
    HTML_LEN=${#BODY_HTML}
    HAS_DOCTYPE=$(echo "$BODY_HTML" | grep -c "<!DOCTYPE" || true)
    HAS_CLOSE=$(echo "$BODY_HTML" | grep -c "</html>" || true)
    echo "  ✓ HTML body present ($HTML_LEN chars)"
    echo "  ✓ Has DOCTYPE: $([ $HAS_DOCTYPE -gt 0 ] && echo 'YES' || echo 'NO')"
    echo "  ✓ Has closing tags: $([ $HAS_CLOSE -gt 0 ] && echo 'YES' || echo 'NO')"
  else
    echo "  ❌ HTML body missing"
  fi
  echo ""
  
  echo "8️⃣  CTA Validation:"
  echo "  CTA Text: $CTA_TEXT"
  echo "  CTA URL: $CTA_URL"
  echo ""
  
  echo "9️⃣  Metadata:"
  echo "  Model: $MODEL"
  echo "  Error: $ERROR"
  echo ""
  
  # Summary
  echo "════════════════════════════════════════════════════════════════"
  if [ "$SUBJECT" != "NULL" ] && [ "$BODY_PLAIN" != "NULL" ] && [ "$BODY_HTML" != "NULL" ]; then
    echo "✓ ALL VALIDATIONS PASSED"
    echo ""
    echo "FULL RESPONSE:"
    echo "$RESPONSE" | jq '.'
    exit 0
  else
    echo "❌ SOME VALIDATIONS FAILED"
    exit 1
  fi
else
  echo "❌ Invalid JSON response"
  echo "$RESPONSE"
  exit 1
fi
