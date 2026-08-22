/* Hash a known vector with EVP and print a PASS marker with the runtime version. */
#include <stdio.h>
#include <string.h>

#include <openssl/crypto.h>
#include <openssl/evp.h>
#include <openssl/opensslv.h>

int main(void) {
    static const char msg[] = "crossbind wasi e2e";
    static const char expected[] =
        "33dad34c52d46555f4f51f2d2750fb3501e35254a3828503774369dcaeab135c";
    unsigned char md[EVP_MAX_MD_SIZE];
    unsigned int len = 0;

    if (!EVP_Digest(msg, sizeof msg - 1, md, &len, EVP_sha256(), NULL)) {
        fprintf(stderr, "FAIL: EVP_Digest errored\n");
        return 1;
    }

    char hex[EVP_MAX_MD_SIZE * 2 + 1];
    for (unsigned int i = 0; i < len; i += 1) {
        sprintf(hex + i * 2, "%02x", md[i]);
    }
    if (len != 32 || strcmp(hex, expected) != 0) {
        fprintf(stderr, "FAIL: sha256 mismatch (%s)\n", hex);
        return 1;
    }

    printf("%s: PASS (sha256 ok)\n", OpenSSL_version(OPENSSL_VERSION));
    return 0;
}
