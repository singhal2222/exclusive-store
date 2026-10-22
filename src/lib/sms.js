// ============================================================
// MSG91 SMS SERVICE
// ============================================================

const MSG91_API_URL = "https://control.msg91.com/api/v5/flow";

// ============================================================
// SEND SIGNUP VERIFICATION OTP
// ============================================================

export async function sendSignupVerificationOtp({
    phone,
    otp,
}) {
    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------

    if (!phone) {
        throw new Error("Phone number is required.");
    }

    if (!otp) {
        throw new Error("OTP is required.");
    }

    // ----------------------------------------------------------
    // ENVIRONMENT VARIABLES
    // ----------------------------------------------------------

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey) {
        throw new Error("MSG91_AUTH_KEY is not configured.");
    }

    if (!templateId) {
        throw new Error("MSG91_TEMPLATE_ID is not configured.");
    }

    // ----------------------------------------------------------
    // FORMAT INDIAN PHONE NUMBER
    // ----------------------------------------------------------
    // The MSG91 API expects the mobile number with country code.
    //
    // Example:
    // 9876543210
    // becomes:
    // 919876543210
    //
    // If 919876543210 is already supplied, it remains unchanged.
    // ----------------------------------------------------------

    const formattedPhone = formatIndianPhoneNumber(phone);

    // ----------------------------------------------------------
    // REQUEST BODY
    // ----------------------------------------------------------

    const requestBody = {
        template_id: templateId,

        // 0 = short URL disabled
        short_url: "0",

        recipients: [
            {
                mobiles: formattedPhone,

                // This variable must match the variable name
                // configured inside your MSG91 SMS template.
                VAR1: otp,
            },
        ],
    };

    // ----------------------------------------------------------
    // SEND REQUEST TO MSG91
    // ----------------------------------------------------------

    try {
        const response = await fetch(MSG91_API_URL, {
            method: "POST",

            headers: {
                accept: "application/json",
                authkey: authKey,
                "content-type": "application/json",
            },

            body: JSON.stringify(requestBody),
        });

        // --------------------------------------------------------
        // READ RESPONSE
        // --------------------------------------------------------

        let data;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        // --------------------------------------------------------
        // HANDLE HTTP ERROR
        // --------------------------------------------------------

        if (!response.ok) {
            console.error("MSG91 HTTP Error:", {
                status: response.status,
                data,
            });

            throw new Error(
                data?.message ||
                data?.error ||
                "Failed to send mobile verification OTP."
            );
        }

        // --------------------------------------------------------
        // HANDLE MSG91 API ERROR
        // --------------------------------------------------------

        if (
            data &&
            (
                data.type === "error" ||
                data.type === "failure" ||
                data.status === "error"
            )
        ) {
            console.error("MSG91 API Error:", data);

            throw new Error(
                data.message ||
                data.error ||
                "MSG91 failed to send the OTP."
            );
        }

        // --------------------------------------------------------
        // SUCCESS
        // --------------------------------------------------------

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Send signup verification OTP error:", error);

        throw new Error(
            error?.message ||
            "Failed to send mobile verification OTP."
        );
    }
}

// ============================================================
// FORMAT INDIAN PHONE NUMBER
// ============================================================

function formatIndianPhoneNumber(phone) {
    // Convert to string and remove spaces/symbols.
    let cleanedPhone = String(phone).replace(/\D/g, "");

    // ----------------------------------------------------------
    // CASE 1
    // 10-digit Indian number
    // Example: 9876543210
    // ----------------------------------------------------------

    if (cleanedPhone.length === 10) {
        if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
            throw new Error("Please enter a valid Indian mobile number.");
        }

        return `91${cleanedPhone}`;
    }

    // ----------------------------------------------------------
    // CASE 2
    // 12-digit number with India country code
    // Example: 919876543210
    // ----------------------------------------------------------

    if (
        cleanedPhone.length === 12 &&
        cleanedPhone.startsWith("91")
    ) {
        const mobileNumber = cleanedPhone.slice(2);

        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            throw new Error("Please enter a valid Indian mobile number.");
        }

        return cleanedPhone;
    }

    // ----------------------------------------------------------
    // CASE 3
    // Number entered with +91
    //
    // Example:
    // +91 9876543210
    //
    // After removing non-numeric characters it becomes:
    // 919876543210
    // ----------------------------------------------------------

    throw new Error(
        "Please enter a valid 10-digit Indian mobile number."
    );
}
