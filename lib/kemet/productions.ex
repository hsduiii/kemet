defmodule Kemet.Productions do
  @moduledoc """
  The Productions context.
  """

  import Ecto.Query, warn: false
  alias Kemet.Repo

  alias Kemet.Productions.Production

  @doc """
  Returns the list of productions.

  ## Examples

      iex> list_productions()
      [%Production{}, ...]

  """
  def list_productions do
    Repo.all(Production) |> Repo.preload(:employee)
  end

  @doc """
  Gets a single production.

  Raises `Ecto.NoResultsError` if the Production does not exist.

  ## Examples

      iex> get_production!(123)
      %Production{}

      iex> get_production!(456)
      ** (Ecto.NoResultsError)

  """
  def get_production!(id), do: Repo.get!(Production, id) |> Repo.preload(:employee)

  @doc """
  Creates a production.

  ## Examples

      iex> create_production(%{field: value})
      {:ok, %Production{}}

      iex> create_production(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_production(attrs \\ %{}) do
    %Production{}
    |> Production.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a production.

  ## Examples

      iex> update_production(production, %{field: new_value})
      {:ok, %Production{}}

      iex> update_production(production, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_production(%Production{} = production, attrs) do
    production
    |> Production.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a production.

  ## Examples

      iex> delete_production(production)
      {:ok, %Production{}}

      iex> delete_production(production)
      {:error, %Ecto.Changeset{}}

  """
  def delete_production(%Production{} = production) do
    Repo.delete(production)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking production changes.

  ## Examples

      iex> change_production(production)
      %Ecto.Changeset{data: %Production{}}

  """
  def change_production(%Production{} = production, attrs \\ %{}) do
    Production.changeset(production, attrs)
  end
end
