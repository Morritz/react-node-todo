import React from 'react';

class App extends React.Component {
  state = {
    listItems: [],
    clientToken: '',
    loginStatus: 0
  }

  loginStatus= [ "", "Logowanie w trakcie...", "Pomyślnie zalogowano" , "Rejestracja w trakcie...", "Pomyślnie zarejestrowano"];

  getList(callback)
  {
    fetch('http://localhost:8080/list', 
    {
      method: 'GET',
      headers: {
        'token': this.state.clientToken
      }
  })
    .then(res => {
      if(res.status !== 200)
      {
        alert('Błąd pobierania danych.');
      }
      if (callback !== undefined)
      {
        callback();
      }
      return res;
      })
    .then(res => res.json())
    .then((data) => {
      this.setState({ listItems: data })
    })
    .catch(console.log)
  }

  deleteList(id, callback)
  {
    fetch('http://localhost:8080/list/' + id, 
    {
      method: 'DELETE',
      headers: {
        'token': this.state.clientToken
      },
  })
    .then(res => {
      if(res.status !== 200)
      {
        alert('Błąd usuwania.');
      }
      else if(res.status === 200)
      {
        this.getList();
      }
      callback();
      return res;
      })
    .then(res => res.json())
    .then((data) => {

    })
    .catch(console.log)
  }

  updateList(id, callback)
  {
    fetch('http://localhost:8080/list/' + id, 
    {
      method: 'PUT',
      headers: {
        'token': this.state.clientToken
      },
      body: new URLSearchParams({
        'name': this.refs[id].value,
      }),
  })
    .then(res => {
      if(res.status !== 200)
      {
        alert('Błąd zmiany.');
      }
      else if(res.status === 200)
      {
        this.getList();
      }
      callback();
      return res;
      })
    .then(res => res.json())
    .then((data) => {

    })
    .catch(console.log)
  }

  addList(value, callback)
  {
    fetch('http://localhost:8080/list', 
    {
      method: 'POST',
      headers: {
        'token': this.state.clientToken
      },
      body: new URLSearchParams({
        'name': value,
      }),
  })
    .then(res => {
      if(res.status !== 200)
      {
        alert('Błąd dodawania.');
      }
      else if(res.status === 200)
      {
        this.getList();
      }
      callback();
      return res;
      })
    .then(res => res.json())
    .then((data) => {
      
    })
    .catch(console.log)
  }

  getEntry(event)
  {
    event.persist();
    event.target.disabled = true;
    this.getList(function()
    {
      event.target.disabled = false;
    });
  }

  deleteEntry(id, index,event)
  {
    event.persist();
    event.target.disabled = true;
    this.deleteList(id, function()
    {
      event.target.disabled = false;
    });
  }

  updateEntry(listItem, index,event)
  {
    event.persist();
    event.target.disabled = true;
    this.updateList(listItem.id, function()
    {
      event.target.disabled = false;
    });
  }

  addEntry(event)
  {
    event.persist();
    event.target.disabled = true;
    this.addList(this.refs.addForm.value, function()
    {
      event.target.disabled = false;
    });
  }

  login(event)
  {
    event.preventDefault();
    event.persist();
    event.target.disabled = true;
    this.setState({ loginStatus: 1 }, 
    function()
    {
      fetch('http://localhost:8080/login', 
      {
        method: 'POST',
        body: new URLSearchParams({
          'username': document.getElementById("username").value,
          'password': document.getElementById("password").value
        }),
      })
      .then(res => {
        if(res.status !== 200)
        {
          alert('Błąd logowania');
          this.setState({ loginStatus: 0});
          event.target.disabled = false;
        }
        return res;
        })
      .then(res => res.json())
      .then((data) => {
        this.setState({ loginStatus: 2},
        function()
        {
          this.setState({ clientToken: data.token},
            function()
            {
              this.getList();
            });
        });
        event.target.disabled = false;
      })
      .catch(console.log)

    }
    );

  }

  register(event)
  {
    event.preventDefault();
    event.persist();
    event.target.disabled = true;
    this.setState({ loginStatus: 3 }, 
    function()
    {
      fetch('http://localhost:8080/register', 
      {
        method: 'POST',
        body: new URLSearchParams({
          'username': document.getElementById("username").value,
          'password': document.getElementById("password").value
        }),
      })
      .then(res => {
        if(res.status !== 200)
        {
          alert('Błąd rejestracji');
          this.setState({ loginStatus: 0});
          event.target.disabled = false;
        }
        else if (res.status === 200)
        {
          this.setState({ loginStatus: 4});
          event.target.disabled = false;
        }
        return res;
        })
      .then(res => res.json())
      .then((data) => {

      })
      .catch(console.log)

    }
    );

  }

  componentDidMount() {

  }
  render() {
    let spinner;
    let addinput;

    if (this.state.loginStatus === 1)
    {
      spinner = <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>;
    }
    if (this.state.loginStatus === 2)
    {
      addinput =       <div class="input-group">
      <input type="text" class="form-control" ref="addForm" placeholder="Nowy wpis" aria-label="Nowy wpis" aria-describedby="basic-addon2" />
      <div class="input-group-append">
        <button class="btn btn-outline-secondary" type="button" onClick={(e) => this.addEntry(e)}>+</button>
      </div>
      </div>;
    }
    return     <div className="App">
      <span class="navbar navbar-light bg-light">
  <strong>{this.loginStatus[this.state.loginStatus]}</strong>
  {spinner}
</span>
    <nav class="navbar navbar-light bg-light">
<span class="navbar-brand mb-0 h1">
<form id="loginform" class="form-inline">
  <div class="form-group mb-2">
    <label for="staticEmail2" class="sr-only">Username</label>
    <input type="text" readonly class="form-control" id="username" placeholder="Username"/>
  </div>
  <div class="form-group mx-sm-3 mb-2">
    <label for="inputPassword2" class="sr-only">Password</label>
    <input type="password" class="form-control" id="password" placeholder="Password" />
  </div>
  <button type="submit" class="btn btn-primary mb-2" onClick={(e) => this.login(e)} > Zaloguj </button>
  <button type="submit" class="btn btn-secondary mb-2" onClick={(e) => this.register(e)} > Zarejestruj </button>
</form>
</span>
<button type="submit" class="btn btn-primary mb-2" onClick={(e) => this.deleteEntry('', '', e)}>Usuń listę</button>
<button type="submit" class="btn btn-primary mb-2" onClick={(e) => this.getEntry(e)}>Odśwież listę</button>
</nav>
{addinput}
{this.state.listItems.map((listItem, index) => (
  <div class="card bg-light mb-3">
    <div class="card-body">
      <h5 class="card-title">{listItem.id}.</h5>
      <p class="card-text">{listItem.name}</p>

      <div class="input-group">
  <input type="text" class="form-control" ref={listItem.id} placeholder="Treść" aria-label="Treść" aria-describedby="basic-addon2" />
  <div class="input-group-append">
    <button class="btn btn-outline-secondary" type="button" onClick={(e) => this.updateEntry(listItem, index, e)}>Zmień</button>
    <button class="btn btn-outline-secondary" type="button" onClick={(e) => this.deleteEntry(listItem.id, index, e)}>Usuń</button>
  </div>
  </div>
    </div>
  </div>
))}
  </div>;
  }
}

export default App;