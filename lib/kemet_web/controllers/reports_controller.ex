defmodule KemetWeb.ReportController do
  use KemetWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
