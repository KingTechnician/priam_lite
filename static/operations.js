

localStorage.removeItem("currentTags")

var profanePost = false

var tagDictionary = {}


$.ajax({
  type:"POST",
  url:'/tags',
  contentType:"application/json",
  success: function(data)
  {
    for(var i =0; i<data.length;i++)
    {
      for (var subCategory in data[i].subCategories)
      {
        tagDictionary[data[i].subCategories[subCategory]] = [data[i].category,data[i].color]
      }
    }
    var tagDropdown = document.getElementById("tagDropdown")
    tagArray = Object.keys(tagDictionary)
    for (var i = 0;i<tagArray.length;i++)
    {
      var tag = document.createElement("option")
      tag.innerHTML = tagArray[i]
      tagDropdown.appendChild(tag)
    }
    tagDropdown.addEventListener("change",function()
    {
      if(localStorage.getItem("currentTags") == null)
      {
        localStorage.setItem("currentTags",JSON.stringify([tagDropdown.value]))
        return
      }
      else
      {
        var currentTags = JSON.parse(localStorage.getItem("currentTags"))
        if(!currentTags.includes(tagDropdown.value))
        {
          currentTags.push(tagDropdown.value)
        }
        localStorage.setItem("currentTags",JSON.stringify(currentTags))
      }
      var potentialTag = tagDictionary[tagDropdown.value]
      if(potentialTag==undefined)
      {
        return
      }
      else
      {
        if(!currentTags.includes(potentialTag[0]))
        {
          currentTags.push(potentialTag[0])
          localStorage.setItem("currentTags",JSON.stringify(currentTags))
        }
        var tagsToDisplay = JSON.parse(localStorage.getItem("currentTags"))
        var tagRow = document.getElementById("tagRow")
        tagRow.innerHTML=""
        var introDiv = document.createElement("div")
        introDiv.innerHTML = "Tags:"
        introDiv.classList.add("col");
        tagRow.appendChild(introDiv)
        for (var i = 0; i<tagsToDisplay.length;i++)
        {
          var tagInformation = tagDictionary[tagsToDisplay[i]]
          var tagSpan = document.createElement("span")
          tagSpan.classList = "badge bg-default"
          tagSpan.innerHTML = tagsToDisplay[i]
          if(tagInformation!==undefined)
          {
            tagSpan.style.backgroundColor = tagInformation[1]
          }
          tagSpan.addEventListener("click",function()
          {
            var currentTags = JSON.parse(localStorage.getItem("currentTags"))
            currentTags.splice(currentTags.indexOf(this.innerHTML),1)
            localStorage.setItem("currentTags",JSON.stringify(currentTags))
            this.remove()
          })
          var tagDiv = document.createElement("div")
          tagDiv.classList.add("col")
          tagDiv.appendChild(tagSpan)
          tagRow.appendChild(tagDiv)
        }
      }
    })
  }
})



function checkInput()
{
  var title = document.getElementById("title").value;
  var description = document.getElementById("content").value;
  if(title=='' || description=='')
  {
    alert("Please fill in all the fields")
  }
  $.ajax({
    type:"POST",
    url:"/checkProfanity",
    contentType:"application/json",
    data: JSON.stringify({title,description}),
    success: function(data)
    {
      if(data.result)
      {
        alert("Possible profanity detected. Please remove it.")
      }
      else
      {
        uploadToServer()
      }
    }
  })
}

function randomCode()
{
    return Math.random().toString(36).slice(2)
}

function startAgain() {
  var getResults = document.getElementsByClassName("searchResults")[0]
  while (getResults.firstChild) {
      getResults.removeChild(getResults.firstChild)
  }
}


function openNav() {
    document.getElementById("menuSidenav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
  }
  
  function closeNav() {
    document.getElementById("menuSidenav").style.width = "0";
    document.getElementById("main").style.marginLeft= "0";
  }

  function showContent(name)
  {
    var nameArray = ["account","about","search","newpost"]
    for (var i = 0; i < nameArray.length; i++)
    {
        if(name==nameArray[i])
        {
            document.getElementById(nameArray[i]).style.display = "block";
        }
        else
        {
            document.getElementById(nameArray[i]).style.display = "none";
        }
    }
  }

window.addEventListener("keyup",function()
{
    var category = document.getElementById("searchCategories").value;
    var search = document.getElementById("searchChoice").value;
    var criteria =
    {
        "search": search,
        "category": category.toLowerCase(),
        "email": email
    }


    $.ajax({
      type: "POST",
      url:"/grabdata",
      contentType:"application/json",
      data: JSON.stringify(criteria),
      success: function(data)
      {
        startAgain()
        var grabFirst = data[0]
        if (grabFirst === undefined) 
        {
          var searchTitle = document.getElementById('resultCount')
          searchTitle.innerHTML = "Search Results(0)"
        }
        else
        {
          for (var i = 0; i < Object.keys(data).length; i++) 
          {
            var searchTitle = document.getElementById('resultCount')
            searchTitle.innerHTML = "Search Results(" + Object.keys(data).length + ")"
            createPost(data[i].title,data[i].description,data[i].date,data[i].votes,data[i].identification,data[i].upvoted,data[i].tags)
          }
        }
      }
    })
})

window.addEventListener("keyup",function()
{
  var exampleTitle = document.getElementById("exampleHeader")
  var exampleDescription = document.getElementById("exampleDescription")

  var title = document.getElementById("title")
  var content= document.getElementById("content")

  exampleTitle.innerHTML = title.value
  exampleDescription.innerHTML = content.value
})

var submitContent = document.getElementById("content")

submitContent.addEventListener("keyup",function({key})
{
  var exampleDescription = document.getElementById("exampleDescription");
  if(key==="Enter")
  {
    exampleDescription.innerHTML+="\n";
  }
})

function createPost(title,description,date,votes,identification,upvoted,tags)
{
  var searchResult = document.createElement("div");
  searchResult.classList.add("card");
  searchResult.classList.add("searchResult");

  var searchHeader = document.createElement("div");
  searchHeader.classList.add("card-header");
  searchHeader.innerHTML = title;
  searchResult.append(searchHeader)

  var searchBody = document.createElement("div");
  searchBody.classList.add("card-body");

  var searchDescription = document.createElement("p");
  searchDescription.classList.add("card-text");
  searchDescription.innerHTML = description;
  searchBody.appendChild(searchDescription);
  searchResult.append(searchBody);

  var searchFooter = document.createElement("div")
  searchFooter.classList.add("card-footer");
  searchFooter.classList.add("text-muted");

  var footerContainer = document.createElement("div");
  footerContainer.classList.add("container");

  var containerRow = document.createElement("div");
  containerRow.classList.add("row");
  var columns = [];
  for (var i = 0; i < 4; i++)
  {
    columns[i] = document.createElement("div");
    columns[i].classList.add("col");
  }

  
  var columnContent = [];
  for (var i = 0; i < 4; i++)
  {
    columnContent[i] = document.createElement("p");
    columnContent[i].classList.add("card-text");
  }
  columnContent[0].innerHTML = "Posted on: "+date;
  columnContent[1].innerHTML = "Votes: "+votes;
  columnContent[2].innerHTML = "ID: "+identification;

  var grabIcon = document.createElement("i");
  grabIcon.style.fontSize="24px";
  grabIcon.classList.add("fa");
  grabIcon.classList.add("fa-thumbs-up");
  grabIcon.classList.add("upvote");
  if(upvoted==true)
  {
    grabIcon.style.color="blue"
  }
  grabIcon.addEventListener("click",function()
  {
    $.ajax({
      type: "POST",
      url:"/upvote",
      contentType:"application/json",
      data: JSON.stringify({"email":email,"identification":identification}),
      success: function(data)
      {
      }
    })
    if(grabIcon.style.color=='')
    {
      grabIcon.style.color="blue"
    }
    else
    {
      grabIcon.style.color=''
    }
  })
  columnContent[3].appendChild(grabIcon);

  for(var i = 0; i<columnContent.length;i++)
  {
    columns[i].appendChild(columnContent[i]);
  }

  for(var i  =0; i<columnContent.length;i++)
  {
    containerRow.appendChild(columns[i]);
  }

  var tagRow = document.createElement("div");
  tagRow.classList.add("row");
  tagRow.innerHTML=""
  var introDiv = document.createElement("div")
  introDiv.innerHTML = "Tags:"
  introDiv.classList.add("col");
  tagRow.appendChild(introDiv);
  if(tags!==undefined && tags!==null &&tags.length!==undefined)
  {
    for (var i = 0; i<tags.length;i++)
    {
      var tagInformation = tagDictionary[tags[i]]
      var tagSpan = document.createElement("span")
      tagSpan.classList = "badge bg-default"
      tagSpan.innerHTML = tags[i]
      tagSpan.style.color="black"
      if(tagInformation!==undefined)
      {
        tagSpan.style.backgroundColor = tagInformation[1]
        tagSpan.style.color="black"
      }
      var tagDiv = document.createElement("div")
      tagDiv.classList.add("col")
      tagDiv.appendChild(tagSpan)
      tagRow.appendChild(tagDiv)
    }
  }

  footerContainer.appendChild(containerRow);
  footerContainer.appendChild(tagRow);
  searchFooter.appendChild(footerContainer);
  searchResult.appendChild(searchFooter);
  searchResult.classList.add("w-50");

  var grabResults = document.getElementsByClassName("searchResults")[0];
  var buffer = document.createElement("p");
  buffer.classList.add("w-100")
  grabResults.appendChild(searchResult);
  grabResults.appendChild(buffer);
}

function uploadToServer()
{
  var title = document.getElementById("title").value;
  var description = document.getElementById("content").value;
  var date = Date.now().toString();
  var identification = randomCode()
  var votes = 0
  var tags = JSON.parse(localStorage.getItem("currentTags"))
  var criteria = {title,description,votes,date,identification,tags}

  criteria = JSON.stringify(criteria)
  $.ajax({
    type: "POST",
    url:"/upload",
    contentType:"application/json",
    data: JSON.stringify(criteria),
    success: function(data)
    {
      location.reload()
    }
  })
}