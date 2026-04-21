export default function DashboardPage() {

  return (

    <div style={{ padding: 40 }}>

      <h1>Host Dashboard</h1>

      <p>Welcome to your AI Co-Host control panel.</p>

      <div style={{ marginTop: 30 }}>

        <a href="/dashboard/conversations">
          Conversations
        </a>

        <br />
        <br />

        <a href="/dashboard/issues">
          Issues
        </a>

      </div>

    </div>

  )

}