
import json
from pymongo import MongoClient
from os import environ as env
import os
from urllib.parse import quote_plus, urlencode

from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import Flask, redirect, render_template, session, url_for, request

from mongoAggregate import aggregate

from better_profanity import profanity


load_dotenv()

mongoVariable = os.getenv("ATLAS_URI")

client = MongoClient(mongoVariable)


ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

app = Flask(__name__,template_folder="templates",static_folder="static")
app.secret_key = env.get("APP_SECRET_KEY")


oauth = OAuth(app)

oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration',
)


@app.route("/")
def home():
    return render_template(
        "home.html",
        session=session.get("user"),
        pretty=json.dumps(session.get("user"), indent=4),
    )


@app.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    return redirect("/")


@app.route("/login")
def login():
    print("Test")
    print(oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    ))
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )


@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://"
        + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )

@app.route("/grabdata",methods=['POST'])
def grabData():
    searchResults = {}
    db= client.changeWorthy
    posts = db.onlinePosts
    votes=  db.postCounts
    criteria = request.get_json()
    users = db.users
    getUser = users.find_one({"email":criteria["email"]})
    convertCriteria = json.dumps(criteria)
    finishedConverting = json.loads(convertCriteria)
    print(finishedConverting)
    query = {finishedConverting['category']:finishedConverting['search']}
    searchList = posts.find()
    count = 0
    for s in searchList:
       if((finishedConverting['search'] in s[finishedConverting['category']]) and finishedConverting['search']!=""):
           del s['_id']
           idSearch = votes.find_one({"identification":s['identification']})
           if(getUser is not None and s["identification"] in getUser["upvotedPosts"]):
            s["upvoted"] = True
           else:
            s["upvoted"] = False
           if(idSearch is None):
                s["votes"] = 0
           else:
                s["votes"] = idSearch["votes"]
           searchResults[count] = s
           count+=1
    return json.loads(json.dumps(searchResults))

@app.route('/upload',methods=['POST'])
def upload():
    db = client.changeWorthy
    posts = db.onlinePosts
    output= request.get_json()
    result = json.loads(output)
    posts.insert_one(result)
    aggregate()
    return {'result':'success!'}

@app.route('/checkAccountInformation',methods=['POST'])
def checkAccountInformation():
    db = client.changeWorthy
    users = db.users
    output = request.get_json()
    result = json.loads(output)
    query = {'email':result['email']}
    print("This is a test.")
    user = users.find_one(query)
    if(user == None):
        newUser=json.loads(json.dumps({'email:':result['email'],'upvotedPosts':[]}))
        users.insert_one(newUser)
        return {'result':'accountFound'}
    return {'result':'accountAdded'}

@app.route('/checkProfanity',methods=['POST'])
def checkProfanity():
    output = request.get_json()
    print(output)
    vulgarTitle = profanity.contains_profanity(output['title'])
    print(vulgarTitle)
    vulgarDescription = profanity.contains_profanity(output['description'])
    if(vulgarTitle or vulgarDescription):
        return {'result':True}
    return {'result':False}

@app.route('/upvote',methods=['POST'])
def upvote():
    db = client.changeWorthy
    users = db.users
    votes = db.postCounts
    output = request.get_json()
    print(output)
    getUser = users.find_one({'email':output['email']})
    print(getUser)
    result = {}
    if(getUser is None):
        print("The user and their posts will be created here.")
        newUser = {}
        newUser['email'] = output['email']
        upvotedPosts = []
        upvotedPosts.append(output['identification'])
        newUser['upvotedPosts'] = upvotedPosts
        users.insert_one(newUser)
        aggregate()
        result = {'result':'userDataCreated'}
    else:
        if(output['identification'] in getUser['upvotedPosts']):
            getUser['upvotedPosts'].remove(output['identification'])
            filter = {'email':output['email']}
            updateRequest = {"$set": {'upvotedPosts':getUser['upvotedPosts']}}
            users.update_one(filter,updateRequest)
            result = {'result':'userLikeRemoved'}
        else:
            getUser['upvotedPosts'].append(output['identification'])
            filter = {'email':output['email']}
            updateRequest = {"$set": {'upvotedPosts':getUser['upvotedPosts']}}
            users.update_one(filter,updateRequest)
            result = {'result':'userLikeAdded'}
        aggregate()
    return result

@app.route('/tags',methods=['POST'])
def tags():
    with open('postTags.json') as json_file:
        data = json.load(json_file)
        return data


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=env.get("PORT", 3000),debug=True)
