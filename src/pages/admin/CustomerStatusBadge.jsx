import StatusBadge from '../../components/StatusBadge'

function CustomerStatusBadge({ status }) {
  return status === 'disabled' ? <StatusBadge status="Disabled" tone="inactive" /> : <StatusBadge status="Active" />
}

export default CustomerStatusBadge
