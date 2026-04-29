Handling multiple rapid clicks
disable the button
async function submit() {
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; // Stop the madness!
    
    try {
        await axios.post(...);
    } finally {
        btn.disabled = false; // Re-enable if there was an error
    }
}
________________________________________________________
Debouncing

________________________________________________________
AbortController