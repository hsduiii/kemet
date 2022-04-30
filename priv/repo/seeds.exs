# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Kemet.Repo.insert!(%Kemet.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.
alias Kemet.Repo, as: Db
Db.insert!(%Kemet.Accounts.Admin{email: "admin@kemet.com.mx", hashed_password: Bcrypt.hash_pwd_salt("adm1n!007")})
