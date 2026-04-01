<?php
/**
 * CCAvenue Multi-Protocol Payment Initiator (PHP Native for OviPanel)
 * Handles encryption for legacy Java specs on shared hosting.
 */

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// --- 1. CONFIGURATION ---
$MERCHANT_ID = "4399469";
$ACCESS_CODE = "AVRB83MH23BQ11BRQB";
$WORKING_KEY = "77CBADC7443F52193CDD382949264C51"; 
$REDIRECT_URL = "https://gagnersports.com/api/ccavResponse.php";

// --- 2. ENCRYPTION CORE ---
function ccav_encrypt($plainText, $workingKey) {
    // Legacy MD5 Binary Key Derivation
    $key = md5($workingKey, true);
    
    // Procedural 16-byte Binary IV (Official Kit Spec)
    $iv = hex2bin('000102030405060708090a0b0c0d0e0f');
    
    $encrypted = openssl_encrypt($plainText, 'aes-128-cbc', $key, OPENSSL_RAW_DATA, $iv);
    return bin2hex($encrypted);
}

// --- 3. EXECUTION ---
try {
    $amount = isset($_GET['amount']) ? number_format($_GET['amount'], 2, '.', '') : '1.00';
    $orderId = isset($_GET['orderId']) ? $_GET['orderId'] : 'ORD'.time();

    $plainText = "merchant_id=$MERCHANT_ID&order_id=$orderId&currency=INR&amount=$amount&redirect_url=$REDIRECT_URL&cancel_url=https://gagnersports.com/failure&language=EN";

    $encRequest = ccav_encrypt($plainText, $WORKING_KEY);

    echo json_encode([
        "success" => true,
        "encRequest" => $encRequest,
        "access_code" => $ACCESS_CODE,
        "merchant_id" => $MERCHANT_ID,
        "gateway_url" => "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
