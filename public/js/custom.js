//custom things

function testApi() {
    FB.login(function (response) {

        const { authResponse: { accessToken, userID } } = response;
        fetch('/login-bla', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ accessToken, userID })
        }).then(res => {
            res.json().then(function (data) {
                console.log("Redirecting");
                console.log(FB.getAccessToken());
                //redirecting based on the response from /login-bla api, in our case /lobby
                window.location = data.redirect;
            });
        });

        FB.api('/me', function (response) {
            console.log('Good to see you, ' + response.name + '.');
        });
    });
};

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        console.log('Logged in and authentificated');
    } else {
        console.log('Not authenticated');
    }
};

function checkLoginState() {
    FB.getLoginStatus(function (response) {
        //statusChangeCallback(response);
        console.log(response.status);
    });
};


function logout() {

    FB.getLoginStatus(function (response) {
        const { authResponse: { accessToken, userID } } = response;
        if (response.status === 'connected') {
            FB.logout(function (response) {
                document.location.href = "https://www.fhrstables.com";
                console.log("Logged out...");
            });
        }

    }, true);
};


