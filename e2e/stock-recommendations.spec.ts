import { expect, test } from "@playwright/test"

test("홈 진입 시 추천종목 제목이 표시된다", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("오늘의 추천종목")).toBeVisible()
})

test("홈 진입 시 트렌드 랭킹 섹션이 표시된다", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("트렌드 랭킹")).toBeVisible()
})

test("종목 행 클릭 시 모달이 열리고 닫힌다", async ({ page }) => {
  await page.goto("/")

  // 종목 데이터가 로드될 때까지 대기 (스켈레톤이 사라질 때까지)
  await page.waitForSelector("[data-testid='skeleton-card']", { state: "detached", timeout: 10000 }).catch(() => {})

  const rows = page.locator("table tbody tr")
  const rowCount = await rows.count()

  if (rowCount > 0) {
    await rows.first().click()
    await expect(page.getByRole("dialog")).toBeVisible()

    // 닫기 버튼 클릭
    await page.getByRole("button", { name: /close/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible()
  }
})

test("트렌드 랭킹 20일 선택 시 URL 파라미터가 변경된다", async ({ page }) => {
  let trendUrl = ""

  page.on("request", (req) => {
    if (req.url().includes("/api/recommendations/trend")) {
      trendUrl = req.url()
    }
  })

  await page.goto("/")
  await page.getByText("20일").click()

  // 짧게 대기 후 URL 파라미터 확인
  await page.waitForTimeout(500)
  expect(trendUrl).toContain("days=20")
})
