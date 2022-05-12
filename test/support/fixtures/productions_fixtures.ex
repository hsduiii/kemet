defmodule Kemet.ProductionsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Kemet.Productions` context.
  """

  @doc """
  Generate a production.
  """
  def production_fixture(attrs \\ %{}) do
    {:ok, production} =
      attrs
      |> Enum.into(%{
        capacitor_boxes: 42,
        capacitor_type: "some capacitor_type",
        machine_name: "some machine_name"
      })
      |> Kemet.Productions.create_production()

    production
  end
end
