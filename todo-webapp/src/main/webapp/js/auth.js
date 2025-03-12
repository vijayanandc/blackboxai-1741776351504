// Handle authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        $('#authContainer').addClass('hidden');
        $('#todoContainer').removeClass('hidden');
        // Load todos for the authenticated user
        loadTodos();
    } else {
        // User is signed out
        $('#authContainer').removeClass('hidden');
        $('#todoContainer').addClass('hidden');
    }
});

// Initialize reCAPTCHA verifier
let recaptchaVerifier;
let confirmationResult;

$(document).ready(() => {
    // Initialize reCAPTCHA
    recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
            // Enable the send code button when reCAPTCHA is solved
            $('#sendCode').prop('disabled', false);
        }
    });
    recaptchaVerifier.render();

    // Handle phone number submission
    $('#phoneForm').on('submit', async (e) => {
        e.preventDefault();
        const phoneNumber = $('#phoneNumber').val().trim();

        if (!phoneNumber) {
            showError('Please enter a valid phone number');
            return;
        }

        try {
            // Send verification code
            confirmationResult = await auth.signInWithPhoneNumber(
                phoneNumber, 
                recaptchaVerifier
            );
            
            // Show OTP form
            $('#phoneForm').addClass('hidden');
            $('#otpForm').removeClass('hidden');
            showSuccess('Verification code sent successfully!');
        } catch (error) {
            console.error('Error sending verification code:', error);
            showError('Failed to send verification code. Please try again.');
            recaptchaVerifier.render().then(widgetId => {
                grecaptcha.reset(widgetId);
            });
        }
    });

    // Handle OTP verification
    $('#otpForm').on('submit', async (e) => {
        e.preventDefault();
        const code = $('#otpCode').val().trim();

        if (!code) {
            showError('Please enter the verification code');
            return;
        }

        try {
            // Verify the code
            await confirmationResult.confirm(code);
            showSuccess('Successfully authenticated!');
        } catch (error) {
            console.error('Error verifying code:', error);
            showError('Invalid verification code. Please try again.');
        }
    });

    // Handle logout
    $('#logoutBtn').on('click', async () => {
        try {
            await auth.signOut();
            showSuccess('Successfully logged out!');
            // Reset forms
            $('#phoneForm').removeClass('hidden');
            $('#otpForm').addClass('hidden');
            $('#phoneNumber').val('');
            $('#otpCode').val('');
        } catch (error) {
            console.error('Error signing out:', error);
            showError('Failed to log out. Please try again.');
        }
    });
});

// Error message display function
function showError(message) {
    const errorDiv = $('<div>')
        .addClass('error-message')
        .text(message)
        .hide();
    
    $('.container:visible').prepend(errorDiv);
    errorDiv.slideDown(300).delay(3000).slideUp(300, function() {
        $(this).remove();
    });
}

// Success message display function
function showSuccess(message) {
    const successDiv = $('<div>')
        .addClass('success-message')
        .text(message)
        .hide();
    
    $('.container:visible').prepend(successDiv);
    successDiv.slideDown(300).delay(3000).slideUp(300, function() {
        $(this).remove();
    });
}
