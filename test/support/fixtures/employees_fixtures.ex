defmodule Kemet.EmployeesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Kemet.Employees` context.
  """

  @doc """
  Generate a employee.
  """
  def employee_fixture(attrs \\ %{}) do
    {:ok, employee} =
      attrs
      |> Enum.into(%{
        active: true,
        age: 42,
        lastname: "some lastname",
        name: "some name"
      })
      |> Kemet.Employees.create_employee()

    employee
  end
end
