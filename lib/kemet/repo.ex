defmodule Kemet.Repo do
  use Ecto.Repo,
    otp_app: :kemet,
    adapter: Ecto.Adapters.Postgres
end
