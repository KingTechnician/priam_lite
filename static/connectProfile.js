
//Auth0 stores the sign in information in a "pre" tag. This code accesses the tag, grabs the information, and sets up user information (in specifics, the ID numbers for the posts that the user upvoted.)


var getAccount = document.getElementsByTagName("pre")[0]

var accountInformation = JSON.parse(getAccount.innerHTML)

var email = accountInformation.userinfo.email

//Setting one of the menu options to the username of the person's email upon logging in.
document.getElementById("profileName").innerHTML = accountInformation.userinfo.email.split("@")[0]

var dictionaryValue = JSON.stringify({email})

//Ajax function that will set the user information (will grab from server - if they have no info on server, will register them to the server)
$.ajax({
    type: "POST",
    url:"/checkAccountInformation",
    contentType:"application/json",
    data: JSON.stringify(dictionaryValue),
    success: function(data)
    {
        //console.log(data)
    }
})