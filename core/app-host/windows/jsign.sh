#!/bin/sh
# Signs the files it is given with jsign, by the key the CROSSBIND_WINDOWS_SIGNING_* variables name, which crossbind
# passes into its windows image by name: passwords reach jsign through its env: prefix and never a command line.
set -eu
exec jsign --quiet --storetype "$CROSSBIND_WINDOWS_SIGNING_STORETYPE" \
    ${CROSSBIND_WINDOWS_SIGNING_KEYSTORE:+--keystore "$CROSSBIND_WINDOWS_SIGNING_KEYSTORE"} \
    ${CROSSBIND_WINDOWS_SIGNING_ALIAS:+--alias "$CROSSBIND_WINDOWS_SIGNING_ALIAS"} \
    ${CROSSBIND_WINDOWS_SIGNING_STOREPASS:+--storepass env:CROSSBIND_WINDOWS_SIGNING_STOREPASS} \
    ${CROSSBIND_WINDOWS_SIGNING_KEYPASS:+--keypass env:CROSSBIND_WINDOWS_SIGNING_KEYPASS} \
    ${CROSSBIND_WINDOWS_SIGNING_CERTFILE:+--certfile "$CROSSBIND_WINDOWS_SIGNING_CERTFILE"} \
    --tsmode RFC3161 --tsaurl "${CROSSBIND_WINDOWS_SIGNING_TSAURL:-http://timestamp.digicert.com}" \
    "$@"
