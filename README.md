### About
  Admin panel where you can register employees, their daily productions and export reports.

### Test Application
  * The application is already online: [`Go to application.`](https://hsduiii-kemet.herokuapp.com/)

  ##### Credentials

  * User: `admin@kemet.com.mx`
  * Password: `adm1n!007`

### You can also install it locally.

### Requirements

  Elixir v1.12+ \
  Erlang OTP v24+ \
  Postgres DB \
  Docker \
  Nodejs v14+ \
  NPM 6.14.16+

### Setup

  * Install Elixir and Erlang: [`see instalation guide.`](https://elixir-lang.org/install.html)
  * Install Docker: [`see instalation guide.`](https://docs.docker.com/desktop/)
  * Install NodeJS and NPM: [`see instalation guide.`](https://nodejs.org/es/)
  * Create postgres database: \
   `docker pull postgres`\
   `docker run --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=pgadm1n! -d postgres `

### Install Kemet App

  `git clone https://github.com/hsduiii/kemet.git`

### Kemet

To start the application:

  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.setup`
  * Start Phoenix endpoint with `mix phx.server`

Visit application at [`localhost:4000`](http://localhost:4000) from your browser.

### Credentials

  * User: `admin@kemet.com.mx`
  * Password: `adm1n!007`